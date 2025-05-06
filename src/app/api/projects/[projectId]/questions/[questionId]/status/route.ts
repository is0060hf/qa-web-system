import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { updateQuestionStatusSchema } from '@/lib/validations/question';
import { canAccessProject } from '@/lib/utils/auth';
import { Role, QuestionStatus } from '@prisma/client';

// 質問ステータス更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; questionId: string } }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, questionId } = params;

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

    // リクエストデータのバリデーション
    const validation = await validateRequest(req, updateQuestionStatusSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { status } = validation.data;

    // 権限チェックとステータス遷移の検証
    const isAdmin = user.role === Role.ADMIN;
    const isProjectManager = accessCheck.project.members.some(
      (m: any) => m.role === 'MANAGER' && m.userId === user.id
    ) || accessCheck.project.creatorId === user.id;
    const isQuestionCreator = question.creatorId === user.id;
    const isQuestionAssignee = question.assigneeId === user.id;

    // 各ステータスへの変更権限チェック
    if (status === QuestionStatus.NEW) {
      // NEWへの変更は通常不要（初期状態）
      return NextResponse.json(
        { error: '質問の状態を「新規」に変更することはできません' },
        { status: 400 }
      );
    } else if (status === QuestionStatus.IN_PROGRESS) {
      // 回答中への変更は回答者のみ可能
      if (!isAdmin && !isProjectManager && !isQuestionAssignee) {
        return NextResponse.json(
          { error: '回答者のみが質問の状態を「回答中」に変更できます' },
          { status: 403 }
        );
      }
    } else if (status === QuestionStatus.PENDING_APPROVAL) {
      // 承認待ちへの変更は回答者のみ可能
      if (!isAdmin && !isProjectManager && !isQuestionAssignee) {
        return NextResponse.json(
          { error: '回答者のみが質問の状態を「承認待ち」に変更できます' },
          { status: 403 }
        );
      }

      // 「承認待ち」にするには最低1つの回答が必要
      const answersCount = await prisma.answer.count({
        where: { questionId },
      });

      if (answersCount === 0) {
        return NextResponse.json(
          { error: '質問の状態を「承認待ち」に変更するには、少なくとも1つの回答が必要です' },
          { status: 400 }
        );
      }
    } else if (status === QuestionStatus.CLOSED) {
      // クローズは質問作成者のみ可能
      if (!isAdmin && !isProjectManager && !isQuestionCreator) {
        return NextResponse.json(
          { error: '質問作成者のみが質問を「クローズ」できます' },
          { status: 403 }
        );
      }

      // 「クローズ」にするには最低1つの回答が必要
      const answersCount = await prisma.answer.count({
        where: { questionId },
      });

      if (answersCount === 0) {
        return NextResponse.json(
          { error: '質問をクローズするには、少なくとも1つの回答が必要です' },
          { status: 400 }
        );
      }
    }

    // ステータス更新
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: { status },
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
      },
    });

    // 通知作成（ステータスに応じて）
    if (status === QuestionStatus.CLOSED) {
      // 質問がクローズされたら回答者に通知
      await prisma.notification.create({
        data: {
          userId: question.assigneeId,
          type: 'ANSWERED_QUESTION_CLOSED',
          message: `あなたが回答した質問「${updatedQuestion.title}」がクローズされました`,
          relatedId: questionId,
        },
      });
    } else if (status === QuestionStatus.PENDING_APPROVAL) {
      // 承認待ちになったら質問作成者に通知
      await prisma.notification.create({
        data: {
          userId: question.creatorId,
          type: 'NEW_ANSWER_POSTED',
          message: `質問「${updatedQuestion.title}」に回答が投稿され、承認待ちになりました`,
          relatedId: questionId,
        },
      });
    }

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('質問ステータス更新エラー:', error);
    return NextResponse.json(
      { error: '質問ステータスの更新に失敗しました' },
      { status: 500 }
    );
  }
} 