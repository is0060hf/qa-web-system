import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { Role } from '@prisma/client';

// 質問一覧を取得
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // URLパラメータを取得
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const projectId = searchParams.get('projectId') || '';
    const assigneeId = searchParams.get('assigneeId') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const tagId = searchParams.get('tagId') || '';
    const isDeadlineExpired = searchParams.get('isDeadlineExpired') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // ページネーション用のオフセット計算
    const skip = (page - 1) * limit;

    // 検索条件を構築
    const where: any = {};

    // 管理者でない場合は、自分が関係する質問のみ表示
    if (user.role !== Role.ADMIN) {
      where.OR = [
        { creatorId: user.id },
        { assigneeId: user.id },
        {
          project: {
            OR: [
              { creatorId: user.id },
              { members: { some: { userId: user.id } } }
            ]
          }
        }
      ];
    }

    // プロジェクトIDでフィルタ
    if (projectId) {
      where.projectId = projectId;
    }

    // 担当者IDでフィルタ
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // ステータスでフィルタ
    if (status) {
      where.status = status;
    }

    // 優先度でフィルタ
    if (priority) {
      where.priority = priority;
    }

    // タグIDでフィルタ
    if (tagId) {
      where.tags = {
        some: {
          tagId: tagId
        }
      };
    }

    // 期限切れでフィルタ
    if (isDeadlineExpired) {
      where.deadline = {
        lt: new Date()
      };
    }

    // キーワード検索（タイトルまたは内容に含まれる）
    if (search) {
      const searchCondition = {
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive' as const
            }
          },
          {
            content: {
              contains: search,
              mode: 'insensitive' as const
            }
          }
        ]
      };

      // 既存の条件と組み合わせる
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          searchCondition
        ];
        delete where.OR;
      } else {
        where.AND = [searchCondition];
      }
    }

    // 総件数を取得
    const total = await prisma.question.count({ where });

    // 質問一覧を取得
    const questions = await prisma.question.findMany({
      where,
      skip,
      take: limit,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        },
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
          }
        },
        assignee: {
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
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        _count: {
          select: {
            answers: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // レスポンス形式を整形
    const formattedQuestions = questions.map(question => ({
      id: question.id,
      title: question.title,
      content: question.content,
      status: question.status,
      priority: question.priority,
      deadline: question.deadline,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      project: question.project,
      creator: question.creator,
      assignee: question.assignee,
      tags: question.tags.map(qt => qt.tag),
      answerCount: question._count.answers,
    }));

    return NextResponse.json({
      questions: formattedQuestions,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('質問一覧取得エラー:', error);
    return NextResponse.json(
      { error: '質問一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
} 