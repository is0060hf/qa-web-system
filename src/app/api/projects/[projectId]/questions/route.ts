import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { createQuestionSchema } from '@/lib/validations/question';
import { canAccessProject } from '@/lib/utils/auth';
import { Role } from '@prisma/client';

// プロジェクト内の質問一覧取得
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const projectId = params.projectId;

    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // クエリパラメータの取得
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    const creatorId = searchParams.get('creatorId');
    const priority = searchParams.get('priority');
    const tag = searchParams.get('tag');
    const overdue = searchParams.get('overdue');
    const search = searchParams.get('search'); // キーワード検索

    // フィルタリング条件の構築
    const where: any = {
      projectId,
    };

    // ステータスでフィルタリング
    if (status) {
      where.status = status;
    }

    // 回答者でフィルタリング
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // 質問者でフィルタリング
    if (creatorId) {
      where.creatorId = creatorId;
    }

    // 優先度でフィルタリング
    if (priority) {
      where.priority = priority;
    }

    // タグでフィルタリング
    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    // 期限切れでフィルタリング
    if (overdue === 'true') {
      where.deadline = {
        lt: new Date(),
      };
      where.status = {
        not: 'CLOSED',
      };
    }

    // キーワード検索
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive', // 大文字・小文字を区別しない
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          answers: {
            some: {
              content: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    // 通常のユーザーは自分に関連する質問のみ表示（AdminとプロジェクトManager以外）
    const isAdmin = user.role === Role.ADMIN;
    const isProjectManager = accessCheck.project.members.some(
      (m: any) => m.role === 'MANAGER' && m.userId === user.id
    ) || accessCheck.project.creatorId === user.id;

    if (!isAdmin && !isProjectManager) {
      where.OR = [
        { creatorId: user.id }, // 自分が作成した質問
        { assigneeId: user.id }, // 自分に割り当てられた質問
      ];
    }

    // 質問一覧取得
    const questions = await prisma.question.findMany({
      where,
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
        _count: {
          select: {
            answers: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // 優先度の高い順
        { updatedAt: 'desc' }, // 最終更新日の新しい順
      ],
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('質問一覧取得エラー:', error);
    return NextResponse.json(
      { error: '質問一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 質問作成
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const projectId = params.projectId;

    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // リクエストデータのバリデーション
    const validation = await validateRequest(req, createQuestionSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { title, content, assigneeId, deadline, priority, tagIds } = validation.data;

    // 回答者がプロジェクトメンバーであることを確認
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

    // 質問作成
    const question = await prisma.question.create({
      data: {
        title,
        content,
        projectId,
        creatorId: user.id,
        assigneeId,
        priority: priority || 'MEDIUM',
        deadline: deadline ? new Date(deadline) : null,
        // タグがある場合は接続
        ...(tagIds && tagIds.length > 0
          ? {
              tags: {
                create: tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              },
            }
          : {}),
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

    // 通知作成（回答者へ新規質問の通知）
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        type: 'NEW_QUESTION_ASSIGNED',
        message: `新しい質問「${title}」があなたに割り当てられました`,
        relatedId: question.id,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('質問作成エラー:', error);
    return NextResponse.json(
      { error: '質問の作成に失敗しました' },
      { status: 500 }
    );
  }
} 