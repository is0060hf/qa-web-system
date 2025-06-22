import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { QuestionStatus } from '@prisma/client';
import { getUserFromRequest } from '@/lib/utils/api';

// APIエンドポイントを動的レンダリングに強制
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Authorization ヘッダーからトークンを取得
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // トークンの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 });
    }
    
    const userId = decoded.userId;
    
    // 現在の日付
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    
    // 担当質問の統計情報
    const assignedQuestionsCount = await prisma.question.count({
      where: {
        assigneeId: userId,
        status: {
          not: QuestionStatus.CLOSED
        }
      }
    });
    
    // 完了した質問数
    const completedQuestionsCount = await prisma.question.count({
      where: {
        assigneeId: userId,
        status: QuestionStatus.CLOSED
      }
    });
    
    // 期限が3日以内の質問数
    const nearDeadlineQuestionsCount = await prisma.question.count({
      where: {
        assigneeId: userId,
        status: {
          not: QuestionStatus.CLOSED
        },
        deadline: {
          gte: now,
          lte: threeDaysFromNow
        }
      }
    });
    
    // 期限を過ぎた質問数
    const overdueQuestionsCount = await prisma.question.count({
      where: {
        assigneeId: userId,
        status: {
          not: QuestionStatus.CLOSED
        },
        deadline: {
          lt: now
        }
      }
    });
    
    // 担当質問一覧
    const assignedQuestions = await prisma.question.findMany({
      where: {
        assigneeId: userId,
        status: {
          not: QuestionStatus.CLOSED
        }
      },
      select: {
        id: true,
        title: true,
        deadline: true,
        status: true,
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        deadline: 'asc'
      },
      take: 5
    });
    
    // 作成した質問一覧
    const createdQuestions = await prisma.question.findMany({
      where: {
        creatorId: userId
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        status: true,
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    // 所属プロジェクト一覧（最近更新されたもの）
    const userProjects = await prisma.projectMember.findMany({
      where: {
        userId: userId
      },
      select: {
        project: {
          select: {
            id: true,
            name: true,
            questions: {
              select: {
                id: true,
                answers: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        project: {
          updatedAt: 'desc'
        }
      },
      take: 3
    });
    
    const recentProjects = userProjects.map(membership => {
      const project = membership.project;
      const questionsCount = project.questions.length;
      const answersCount = project.questions.reduce((count, question) => {
        return count + question.answers.length;
      }, 0);
      
      return {
        id: project.id,
        name: project.name,
        questionsCount,
        answersCount
      };
    });
    
    // ダッシュボードデータを構築して返す
    const dashboardData = {
      stats: {
        assignedQuestions: assignedQuestionsCount,
        completedQuestions: completedQuestionsCount,
        nearDeadlineQuestions: nearDeadlineQuestionsCount,
        overdueQuestions: overdueQuestionsCount
      },
      assignedQuestions: assignedQuestions.map(q => ({
        id: q.id,
        title: q.title,
        project: q.project.name,
        deadline: q.deadline?.toISOString() || '',
        status: q.status
      })),
      createdQuestions: createdQuestions.map(q => ({
        id: q.id,
        title: q.title,
        project: q.project.name,
        createdAt: q.createdAt.toISOString(),
        status: q.status
      })),
      recentProjects
    };
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('ダッシュボードデータ取得エラー:', error);
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
} 