import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { QuestionStatus, NotificationType } from '@prisma/client';

// 期限切れ質問の検出と通知生成API
// このAPIはcronジョブから定期的に実行される想定
export async function POST(req: NextRequest) {
  try {
    // APIキーによる認証チェック (実際の環境ではより強固な認証が必要)
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.CRON_API_KEY;

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: '認証エラー' },
        { status: 401 }
      );
    }

    // 期限切れかつ通知未送信の質問を検索
    const overdueQuestions = await prisma.question.findMany({
      where: {
        status: {
          in: [QuestionStatus.NEW, QuestionStatus.IN_PROGRESS]
        },
        deadline: {
          lt: new Date() // 現在より前の期限 = 期限切れ
        },
        isDeadlineNotified: false // 通知未送信
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    if (overdueQuestions.length === 0) {
      return NextResponse.json({
        message: '期限切れの質問はありません',
        processed: 0
      });
    }

    // 各期限切れ質問に対して通知を生成
    const notificationResults = await Promise.all(
      overdueQuestions.map(async (question) => {
        // トランザクションで通知生成と質問更新を実行
        return prisma.$transaction(async (tx) => {
          // 回答者への通知
          await tx.notification.create({
            data: {
              userId: question.assigneeId,
              type: NotificationType.ASSIGNEE_DEADLINE_EXCEEDED,
              message: `質問「${question.title}」の回答期限が過ぎています（プロジェクト: ${question.project.name}）`,
              relatedId: question.id,
            },
          });

          // 質問者への通知
          await tx.notification.create({
            data: {
              userId: question.creatorId,
              type: NotificationType.REQUESTER_DEADLINE_EXCEEDED,
              message: `あなたの質問「${question.title}」の回答期限が過ぎました（プロジェクト: ${question.project.name}）`,
              relatedId: question.id,
            },
          });

          // 質問を通知済みに更新
          await tx.question.update({
            where: { id: question.id },
            data: { isDeadlineNotified: true },
          });

          return question.id;
        });
      })
    );

    return NextResponse.json({
      message: `${notificationResults.length}件の期限切れ質問に関する通知を生成しました`,
      processed: notificationResults.length,
      questionIds: notificationResults,
    });
  } catch (error) {
    console.error('期限切れ質問の通知生成エラー:', error);
    return NextResponse.json(
      { error: '期限切れ質問の通知生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 