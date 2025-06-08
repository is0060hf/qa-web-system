import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { z } from 'zod';

// スレッド作成のスキーマ
const createThreadSchema = z.object({
  content: z.string().min(1).max(5000),
});

// GET /api/questions/[questionId]/answers/[answerId]/threads - スレッド一覧取得
export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ questionId: string; answerId: string }>;
  }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { questionId, answerId } = await context.params;

    // 回答の存在確認と権限チェック
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          include: {
            project: {
              include: {
                members: {
                  where: {
                    userId: user.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!answer) {
      return NextResponse.json(
        { error: '回答が見つかりません' },
        { status: 404 }
      );
    }

    if (answer.questionId !== questionId) {
      return NextResponse.json(
        { error: '不正なリクエストです' },
        { status: 400 }
      );
    }

    // アクセス権限チェック
    const isAdmin = user.role === 'ADMIN';
    const isCreator = answer.question.creatorId === user.id;
    const isAssignee = answer.question.assigneeId === user.id;
    const isProjectMember = answer.question.project.members.length > 0;

    if (!isAdmin && !isCreator && !isAssignee && !isProjectMember) {
      return NextResponse.json(
        { error: 'このスレッドを閲覧する権限がありません' },
        { status: 403 }
      );
    }

    // スレッド一覧を取得
    const threads = await prisma.thread.findMany({
      where: { answerId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: {
              select: {
                id: true,
                storageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(threads.map(thread => ({
      id: thread.id,
      content: thread.content,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      creator: {
        id: thread.creator.id,
        name: thread.creator.name || thread.creator.email,
        email: thread.creator.email,
        profileImage: thread.creator.profileImage,
      },
    })));
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'スレッドの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST /api/questions/[questionId]/answers/[answerId]/threads - スレッド作成
export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ questionId: string; answerId: string }>;
  }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { questionId, answerId } = await context.params;
    const body = await request.json();

    // バリデーション
    const validatedData = createThreadSchema.parse(body);

    // 回答の存在確認と権限チェック
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          include: {
            project: {
              include: {
                members: {
                  where: {
                    userId: user.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!answer) {
      return NextResponse.json(
        { error: '回答が見つかりません' },
        { status: 404 }
      );
    }

    if (answer.questionId !== questionId) {
      return NextResponse.json(
        { error: '不正なリクエストです' },
        { status: 400 }
      );
    }

    // アクセス権限チェック（質問作成者、回答者、プロジェクトメンバーのみコメント可能）
    const isAdmin = user.role === 'ADMIN';
    const isCreator = answer.question.creatorId === user.id;
    const isAssignee = answer.question.assigneeId === user.id;
    const isProjectMember = answer.question.project.members.length > 0;

    if (!isAdmin && !isCreator && !isAssignee && !isProjectMember) {
      return NextResponse.json(
        { error: 'このスレッドにコメントする権限がありません' },
        { status: 403 }
      );
    }

    // スレッド作成
    const thread = await prisma.thread.create({
      data: {
        content: validatedData.content,
        answerId,
        creatorId: user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: {
              select: {
                id: true,
                storageUrl: true,
              },
            },
          },
        },
      },
    });

    // 通知作成（回答者と質問作成者に通知）
    const notificationRecipients = new Set<string>();
    
    // 回答者に通知（コメント作成者自身でない場合）
    if (answer.creatorId !== user.id) {
      notificationRecipients.add(answer.creatorId);
    }
    
    // 質問作成者に通知（コメント作成者自身でない場合）
    if (answer.question.creatorId !== user.id) {
      notificationRecipients.add(answer.question.creatorId);
    }

    for (const recipientId of notificationRecipients) {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'NEW_ANSWER_POSTED', // スレッドコメントも回答として通知
          message: `「${answer.question.title}」の回答にコメントが追加されました`,
          relatedId: answer.questionId,
        },
      });
    }

    return NextResponse.json({
      id: thread.id,
      content: thread.content,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      creator: {
        id: thread.creator.id,
        name: thread.creator.name || thread.creator.email,
        email: thread.creator.email,
        profileImage: thread.creator.profileImage,
      },
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'リクエストデータが不正です', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'スレッドの作成に失敗しました' },
      { status: 500 }
    );
  }
} 