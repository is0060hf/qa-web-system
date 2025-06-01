import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { canAccessProject } from '@/lib/utils/auth';
import { z } from 'zod';
import { QuestionPriority, QuestionStatus } from '@prisma/client';

// リクエストスキーマ
const createQuestionFromAnswerSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  content: z.string().optional(),
  assigneeId: z.string().min(1, '担当者は必須です'),
  deadline: z.string().datetime().nullable().optional(),
  priority: z.nativeEnum(QuestionPriority).optional().default(QuestionPriority.MEDIUM),
  tagIds: z.array(z.string()).optional().default([]),
  projectId: z.string().optional(), // 指定しない場合は元の質問のプロジェクト
  includeOriginalContent: z.boolean().optional().default(true),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { questionId: string; answerId: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { questionId, answerId } = params;

    // 元の質問と回答を取得
    const originalQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        project: true,
        answers: {
          where: { id: answerId },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!originalQuestion) {
      return NextResponse.json(
        { error: '質問が見つかりません' },
        { status: 404 }
      );
    }

    if (originalQuestion.answers.length === 0) {
      return NextResponse.json(
        { error: '回答が見つかりません' },
        { status: 404 }
      );
    }

    const originalAnswer = originalQuestion.answers[0];

    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(originalQuestion.projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // リクエストのバリデーション
    const validation = await validateRequest(req, createQuestionFromAnswerSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      title,
      content,
      assigneeId,
      deadline,
      priority,
      tagIds,
      projectId = originalQuestion.projectId,
      includeOriginalContent,
    } = validation.data;

    // 対象プロジェクトへのアクセス権をチェック（異なるプロジェクトの場合）
    if (projectId !== originalQuestion.projectId) {
      const targetAccessCheck = await canAccessProject(projectId, user);
      if (!targetAccessCheck.success) {
        return targetAccessCheck.error;
      }
    }

    // 担当者の存在確認
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      return NextResponse.json(
        { error: '指定された担当者が見つかりません' },
        { status: 400 }
      );
    }

    // 担当者がプロジェクトメンバーかチェック
    const assigneeMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: assigneeId,
        },
      },
    });

    if (!assigneeMembership) {
      return NextResponse.json(
        { error: '指定された担当者はプロジェクトのメンバーではありません' },
        { status: 400 }
      );
    }

    // タグの存在確認
    if (tagIds && tagIds.length > 0) {
      const tags = await prisma.projectTag.findMany({
        where: {
          id: { in: tagIds },
          projectId,
        },
      });

      if (tags.length !== tagIds.length) {
        return NextResponse.json(
          { error: '無効なタグIDが含まれています' },
          { status: 400 }
        );
      }
    }

    // 引用コンテンツの準備
    let finalContent = content || '';
    if (includeOriginalContent) {
      const quotedContent = `> 元の質問: ${originalQuestion.title}\n` +
        `> 回答者: ${originalAnswer.creator.name || originalAnswer.creator.email}\n` +
        `> 回答日時: ${originalAnswer.createdAt.toLocaleString('ja-JP')}\n` +
        `> \n` +
        `> ${originalAnswer.content.split('\n').join('\n> ')}\n\n`;
      
      finalContent = quotedContent + finalContent;
    }

    // トランザクションで質問とタグの関連を作成
    const newQuestion = await prisma.$transaction(async (tx) => {
      // 質問を作成
      const question = await tx.question.create({
        data: {
          title,
          content: finalContent,
          status: QuestionStatus.NEW,
          priority,
          deadline: deadline ? new Date(deadline) : null,
          projectId,
          creatorId: user.id,
          assigneeId,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // タグを関連付け
      if (tagIds && tagIds.length > 0) {
        await Promise.all(
          tagIds.map((tagId) =>
            tx.questionTag.create({
              data: {
                questionId: question.id,
                tagId,
              },
            })
          )
        );
      }

      // 通知を作成（新規質問割り当て）
      await tx.notification.create({
        data: {
          userId: assigneeId,
          type: 'NEW_QUESTION_ASSIGNED',
          message: `新しい質問「${title}」が割り当てられました`,
          relatedId: question.id,
        },
      });

      return question;
    });

    // タグ情報を取得して返す
    const questionWithTags = await prisma.question.findUnique({
      where: { id: newQuestion.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // レスポンス形式を整形
    const formattedQuestion = {
      ...questionWithTags,
      tags: questionWithTags?.tags.map(t => ({
        id: t.tag.id,
        name: t.tag.name,
      })),
    };

    return NextResponse.json(formattedQuestion, { status: 201 });
  } catch (error) {
    console.error('回答から質問作成エラー:', error);
    return NextResponse.json(
      { error: '質問の作成に失敗しました' },
      { status: 500 }
    );
  }
} 