import { NextRequest, NextResponse } from 'next/server';
import { POST as checkDeadlines } from '@/app/api/cron/check-deadlines/route';
import { QuestionStatus, NotificationType } from '@prisma/client';
import prisma from '@/lib/db';

// NextResponse.jsonをモック
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((body, init) => {
        return {
          body,
          status: init?.status || 200,
        };
      }),
    },
  };
});

describe('Check Deadlines Cron Job Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 環境変数の設定
    process.env.CRON_API_KEY = 'test-cron-api-key';
  });

  afterEach(() => {
    // テスト後に環境変数をリセット
    delete process.env.CRON_API_KEY;
  });

  describe('POST /api/cron/check-deadlines', () => {
    it('should require authentication with API key', async () => {
      // API キーのないリクエスト
      const req = new NextRequest('https://example.com/api/cron/check-deadlines', {
        method: 'POST',
      });
      
      // API呼び出し
      const response = await checkDeadlines(req);
      
      // 401 Unauthorizedが返ることを確認
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid API key', async () => {
      // 無効なAPI キーのリクエスト
      const req = new NextRequest('https://example.com/api/cron/check-deadlines', {
        method: 'POST',
        headers: {
          'x-api-key': 'invalid-api-key',
        },
      });
      
      // API呼び出し
      const response = await checkDeadlines(req);
      
      // 401 Unauthorizedが返ることを確認
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return success message when no overdue questions', async () => {
      // 期限切れ質問がない場合の設定
      (prisma.question.findMany as jest.Mock).mockResolvedValue([]);
      
      // 有効なAPIキーのリクエスト
      const req = new NextRequest('https://example.com/api/cron/check-deadlines', {
        method: 'POST',
        headers: {
          'x-api-key': 'test-cron-api-key',
        },
      });
      
      // API呼び出し
      const response = await checkDeadlines(req);
      
      // 成功メッセージの確認
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '期限切れの質問はありません');
      expect(response.body).toHaveProperty('processed', 0);
      
      // 正しいクエリが実行されたことを確認
      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [QuestionStatus.NEW, QuestionStatus.IN_PROGRESS] },
            deadline: { lt: expect.any(Date) },
            isDeadlineNotified: false,
          }),
        })
      );
    });

    it('should process overdue questions and create notifications', async () => {
      // 期限切れ質問サンプル
      const overdueQuestions = [
        {
          id: 'question-1',
          title: 'Test Question 1',
          status: QuestionStatus.NEW,
          deadline: new Date(Date.now() - 86400000), // 1日前
          isDeadlineNotified: false,
          assigneeId: 'assignee-1',
          creatorId: 'creator-1',
          project: { name: 'Test Project' },
        },
        {
          id: 'question-2',
          title: 'Test Question 2',
          status: QuestionStatus.IN_PROGRESS,
          deadline: new Date(Date.now() - 43200000), // 12時間前
          isDeadlineNotified: false,
          assigneeId: 'assignee-2',
          creatorId: 'creator-2',
          project: { name: 'Another Project' },
        },
      ];
      
      // モック設定
      (prisma.question.findMany as jest.Mock).mockResolvedValue(overdueQuestions);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });
      
      // 有効なAPIキーのリクエスト
      const req = new NextRequest('https://example.com/api/cron/check-deadlines', {
        method: 'POST',
        headers: {
          'x-api-key': 'test-cron-api-key',
        },
      });
      
      // API呼び出し
      const response = await checkDeadlines(req);
      
      // 成功レスポンスを確認
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '2件の期限切れ質問に関する通知を生成しました');
      expect(response.body).toHaveProperty('processed', 2);
      expect(response.body).toHaveProperty('questionIds', ['question-1', 'question-2']);
      
      // トランザクションが各質問に対して行われたことを確認
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      
      // 回答者への通知が作成されたことを確認
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'assignee-1',
            type: NotificationType.ASSIGNEE_DEADLINE_EXCEEDED,
            relatedId: 'question-1',
          }),
        })
      );
      
      // 質問者への通知が作成されたことを確認
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'creator-1',
            type: NotificationType.REQUESTER_DEADLINE_EXCEEDED,
            relatedId: 'question-1',
          }),
        })
      );
      
      // 質問が通知済みに更新されたことを確認
      expect(prisma.question.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'question-1' },
          data: { isDeadlineNotified: true },
        })
      );
    });

    it('should handle errors during notification process', async () => {
      // エラーを発生させる設定
      (prisma.question.findMany as jest.Mock).mockRejectedValue(new Error('データベースエラー'));
      
      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // 有効なAPIキーのリクエスト
      const req = new NextRequest('https://example.com/api/cron/check-deadlines', {
        method: 'POST',
        headers: {
          'x-api-key': 'test-cron-api-key',
        },
      });
      
      // API呼び出し
      const response = await checkDeadlines(req);
      
      // エラーレスポンスを確認
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      
      // エラーログが出力されていることを確認
      expect(consoleSpy).toHaveBeenCalled();
      
      // モックを復元
      consoleSpy.mockRestore();
    });
  });
}); 