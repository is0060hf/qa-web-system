import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { z } from 'zod';
import { QuestionStatus } from '@prisma/client';

const updateStatusSchema = z.object({
  status: z.nativeEnum(QuestionStatus),
});

// PATCH /api/questions/[questionId]/status - ステータス更新
export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ questionId: string }>;
  }
) {
  try {
    // 認証確認
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // リクエストパラメータを取得
    const { questionId } = await context.params;
    const body = await request.json();

    // バリデーション
    const validatedData = updateStatusSchema.parse(body);

    // 質問の存在確認と権限チェック
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        project: {
          include: {
            members: true,
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

    // 権限チェック：質問の作成者、担当者、またはプロジェクトマネージャーのみ変更可能
    const isCreator = question.creatorId === user.id;
    const isAssignee = question.assigneeId === user.id;
    const projectMember = question.project.members.find(
      (member) => member.userId === user.id
    );
    const isProjectManager = projectMember?.role === 'MANAGER';

    if (!isCreator && !isAssignee && !isProjectManager && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'この質問のステータスを変更する権限がありません' },
        { status: 403 }
      );
    }

    // ステータス遷移のバリデーション
    const currentStatus = question.status;
    const newStatus = validatedData.status;

    // 許可されるステータス遷移を定義
    const allowedTransitions: Record<QuestionStatus, QuestionStatus[]> = {
      NEW: [QuestionStatus.IN_PROGRESS],
      IN_PROGRESS: [QuestionStatus.PENDING_APPROVAL],
      PENDING_APPROVAL: [QuestionStatus.CLOSED, QuestionStatus.IN_PROGRESS],
      CLOSED: [QuestionStatus.IN_PROGRESS], // 再オープン可能
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      return NextResponse.json(
        { error: `${currentStatus}から${newStatus}への変更はできません` },
        { status: 400 }
      );
    }

    // ステータス更新
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 通知作成（ステータスがCLOSEDになった場合）
    if (newStatus === QuestionStatus.CLOSED) {
      await prisma.notification.create({
        data: {
          userId: question.creatorId,
          type: 'ANSWERED_QUESTION_CLOSED',
          message: `質問「${question.title}」が完了しました`,
          relatedId: question.id,
        },
      });
    }

    return NextResponse.json({
      id: updatedQuestion.id,
      status: updatedQuestion.status,
      updatedAt: updatedQuestion.updatedAt,
    });
  } catch (error) {
    console.error('Error updating question status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'リクエストデータが不正です', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'ステータスの更新に失敗しました' },
      { status: 500 }
    );
  }
} 