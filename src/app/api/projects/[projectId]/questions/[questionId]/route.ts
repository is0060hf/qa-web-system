import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { updateQuestionSchema } from '@/lib/validations/question';
import { canAccessProject } from '@/lib/utils/auth';
import { Role, QuestionStatus } from '@prisma/client';

// 質問詳細取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; questionId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, questionId } = await params;

    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // 質問の存在確認
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
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
        answers: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            mediaFiles: {
              include: {
                mediaFile: true,
              },
            },
            formData: {
              include: {
                formField: true,
                mediaFile: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        answerForm: {
          include: {
            fields: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: '質問が見つかりません' },
        { status: 404 }
      );
    }

    // 質問が指定されたプロジェクトに属しているか確認
    if (question.projectId !== projectId) {
      return NextResponse.json(
        { error: '指定されたプロジェクトの質問ではありません' },
        { status: 400 }
      );
    }

    // 通常のユーザーが自分に関連しない質問にアクセスしようとした場合はエラー
    // Admin, プロジェクト作成者、ProjectManagerはすべての質問にアクセス可能
    const isAdmin = user.role === Role.ADMIN;
    const isProjectManager = accessCheck.project.members.some(
      (m: any) => m.role === 'MANAGER' && m.userId === user.id
    ) || accessCheck.project.creatorId === user.id;

    if (!isAdmin && !isProjectManager && question.creatorId !== user.id && question.assigneeId !== user.id) {
      return NextResponse.json(
        { error: 'この質問にアクセスする権限がありません' },
        { status: 403 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('質問詳細取得エラー:', error);
    return NextResponse.json(
      { error: '質問詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 質問更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; questionId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, questionId } = await params;

    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // 質問の存在確認
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        tags: {
          select: { tagId: true },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: '質問が見つかりません' },
        { status: 404 }
      );
    }

    // 質問が指定されたプロジェクトに属しているか確認
    if (question.projectId !== projectId) {
      return NextResponse.json(
        { error: '指定されたプロジェクトの質問ではありません' },
        { status: 400 }
      );
    }

    // 更新権限チェック（質問作成者、管理者、プロジェクト管理者のみ更新可能）
    const isAdmin = user.role === Role.ADMIN;
    const isProjectManager = accessCheck.project.members.some(
      (m: any) => m.role === 'MANAGER' && m.userId === user.id
    ) || accessCheck.project.creatorId === user.id;

    if (!isAdmin && !isProjectManager && question.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'この質問を更新する権限がありません' },
        { status: 403 }
      );
    }

    // クローズ済みの質問は更新不可
    if (question.status === QuestionStatus.CLOSED) {
      return NextResponse.json(
        { error: 'クローズされた質問は更新できません' },
        { status: 400 }
      );
    }

    // リクエストデータのバリデーション
    const validation = await validateRequest(req, updateQuestionSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { title, content, assigneeId, deadline, priority, tagIds } = validation.data;

    // 回答者が変更される場合は、プロジェクトメンバーであることを確認
    if (assigneeId && assigneeId !== question.assigneeId) {
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
          { error: '指定された回答者はプロジェクトメンバーではありません' },
          { status: 400 }
        );
      }
    }

    // タグの存在確認
    if (tagIds && tagIds.length > 0) {
      const existingTags = await prisma.projectTag.findMany({
        where: {
          id: { in: tagIds },
          projectId,
        },
      });

      if (existingTags.length !== tagIds.length) {
        return NextResponse.json(
          { error: '一部の指定されたタグが存在しないか、このプロジェクトに属していません' },
          { status: 400 }
        );
      }
    }

    // トランザクションで質問の更新とタグの更新を行う
    const updatedQuestion = await prisma.$transaction(async (tx) => {
      // 質問の更新
      const updated = await tx.question.update({
        where: { id: questionId },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
          ...(assigneeId !== undefined && { assigneeId }),
          ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
          ...(priority !== undefined && { priority }),
        },
        include: {
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

      // タグの更新
      if (tagIds) {
        // 既存のタグを全て削除
        await tx.questionTag.deleteMany({
          where: { questionId },
        });

        // 新しいタグを追加
        if (tagIds.length > 0) {
          await Promise.all(
            tagIds.map((tagId) =>
              tx.questionTag.create({
                data: {
                  questionId,
                  tagId,
                },
              })
            )
          );
        }

        // 最新のタグ情報を再取得
        const tags = await tx.questionTag.findMany({
          where: { questionId },
          include: {
            tag: true,
          },
        });

        return { ...updated, tags };
      }

      return updated;
    });

    // 回答者が変更された場合は通知を作成
    if (assigneeId && assigneeId !== question.assigneeId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: 'NEW_QUESTION_ASSIGNED',
          message: `質問「${updatedQuestion.title}」があなたに割り当てられました`,
          relatedId: questionId,
        },
      });
    }

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('質問更新エラー:', error);
    return NextResponse.json(
      { error: '質問の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 質問削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; questionId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, questionId } = await params;

    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // 質問の存在確認
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: '質問が見つかりません' },
        { status: 404 }
      );
    }

    // 質問が指定されたプロジェクトに属しているか確認
    if (question.projectId !== projectId) {
      return NextResponse.json(
        { error: '指定されたプロジェクトの質問ではありません' },
        { status: 400 }
      );
    }

    // 削除権限チェック（質問作成者、管理者、プロジェクト管理者のみ削除可能）
    const isAdmin = user.role === Role.ADMIN;
    const isProjectManager = accessCheck.project.members.some(
      (m: any) => m.role === 'MANAGER' && m.userId === user.id
    ) || accessCheck.project.creatorId === user.id;

    if (!isAdmin && !isProjectManager && question.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'この質問を削除する権限がありません' },
        { status: 403 }
      );
    }

    // トランザクションで質問と関連データを削除
    await prisma.$transaction([
      // 通知の削除
      prisma.notification.deleteMany({
        where: { relatedId: questionId },
      }),
      // タグ関連の削除
      prisma.questionTag.deleteMany({
        where: { questionId },
      }),
      // 回答フォームフィールドの削除
      prisma.answerFormField.deleteMany({
        where: {
          answerForm: {
            questionId,
          },
        },
      }),
      // 回答フォームの削除
      prisma.answerForm.deleteMany({
        where: { questionId },
      }),
      // 回答フォームデータの削除
      prisma.answerFormData.deleteMany({
        where: {
          answer: {
            questionId,
          },
        },
      }),
      // 回答メディアファイル関連の削除
      prisma.answerMediaFile.deleteMany({
        where: {
          answer: {
            questionId,
          },
        },
      }),
      // 回答の削除
      prisma.answer.deleteMany({
        where: { questionId },
      }),
      // 質問の削除
      prisma.question.delete({
        where: { id: questionId },
      }),
    ]);

    return NextResponse.json({
      message: '質問が正常に削除されました',
    });
  } catch (error) {
    console.error('質問削除エラー:', error);
    return NextResponse.json(
      { error: '質問の削除に失敗しました' },
      { status: 500 }
    );
  }
} 