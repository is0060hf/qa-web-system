import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { QuestionStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const isDeadlineExpired = searchParams.get('isDeadlineExpired') === 'true';
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'deadline';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // ステータスフィルターの処理
    let statusFilter: QuestionStatus[] = [
      QuestionStatus.NEW,
      QuestionStatus.IN_PROGRESS,
      QuestionStatus.PENDING_APPROVAL,
    ];
    
    if (status) {
      const requestedStatuses = status.split(',') as QuestionStatus[];
      statusFilter = requestedStatuses.filter(s => statusFilter.includes(s));
    }

    // 検索条件の構築
    const where: any = {
      assigneeId: user.id,
      status: { in: statusFilter },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isDeadlineExpired) {
      where.deadline = { lt: new Date() };
    }

    if (projectId) {
      where.projectId = projectId;
    }

    // 並び替えの設定
    const orderBy: any = {};
    if (sortBy === 'deadline') {
      orderBy.deadline = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'priority') {
      // 優先度の並び替え（HIGHEST → LOW）
      orderBy.priority = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    // 総件数を取得
    const total = await prisma.question.count({ where });

    // 質問一覧を取得
    const questions = await prisma.question.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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
    });

    // レスポンス形式を整形
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      title: q.title,
      content: q.content,
      status: q.status,
      priority: q.priority,
      deadline: q.deadline,
      isDeadlineExpired: q.deadline ? new Date(q.deadline) < new Date() : false,
      projectId: q.projectId,
      projectName: q.project.name,
      creatorId: q.creatorId,
      creatorName: q.creator.name || q.creator.email,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      tags: q.tags.map(t => ({
        id: t.tag.id,
        name: t.tag.name,
      })),
      answerCount: q._count.answers,
    }));

    return NextResponse.json({
      questions: formattedQuestions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('担当質問一覧取得エラー:', error);
    return NextResponse.json(
      { error: '担当質問一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
} 