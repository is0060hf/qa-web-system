import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';

// 作成した質問一覧取得
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // クエリパラメータの取得
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const projectId = searchParams.get('projectId');
    const isDeadlineExpired = searchParams.get('isDeadlineExpired');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // フィルタリング条件の構築
    const where: any = {
      creatorId: user.id, // 自分が作成した質問のみ
    };

    // ステータスでフィルタリング
    if (status) {
      where.status = status;
    }

    // 優先度でフィルタリング
    if (priority) {
      where.priority = priority;
    }

    // プロジェクトでフィルタリング
    if (projectId) {
      where.projectId = projectId;
    }

    // 期限切れでフィルタリング
    if (isDeadlineExpired === 'true') {
      where.deadline = {
        lt: new Date(),
      };
      // 期限切れフィルターの場合、クローズ以外の質問のみ表示
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
      ];
    }

    // 総数を取得
    const total = await prisma.question.count({ where });

    // 質問一覧取得
    const questions = await prisma.question.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' }, // 最新作成順
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // レスポンス形式を整形
    const formattedQuestions = questions.map(question => ({
      id: question.id,
      title: question.title,
      projectName: question.project.name,
      status: question.status,
      priority: question.priority,
      deadline: question.deadline,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      assignee: {
        id: question.assignee.id,
        name: question.assignee.name || question.assignee.email,
      },
      answersCount: question._count.answers,
    }));

    return NextResponse.json({
      questions: formattedQuestions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('作成した質問一覧取得エラー:', error);
    return NextResponse.json(
      { error: '質問一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
} 