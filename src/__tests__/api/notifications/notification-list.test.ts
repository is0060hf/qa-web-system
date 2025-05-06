import { NextRequest } from 'next/server';
import { prismaMock } from '@/../jest/singleton';
import * as apiUtils from '@/lib/utils/api';
import { GET } from '@/app/api/notifications/route';
import { Notification, User, Role, NotificationType } from '@prisma/client';

// モックデータ
const mockUser: User = {
  id: 'user1',
  name: 'テストユーザー',
  email: 'test@example.com',
  role: Role.USER,
  passwordHash: 'hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockNotifications: Notification[] = [
  {
    id: 'notification1',
    userId: 'user1',
    type: NotificationType.NEW_QUESTION_ASSIGNED,
    message: 'テスト通知1',
    relatedId: 'question1',
    isRead: false,
    isDeadlineNotified: false,
    createdAt: new Date('2023-01-01T00:00:00Z'),
  },
  {
    id: 'notification2',
    userId: 'user1',
    type: NotificationType.NEW_ANSWER_POSTED,
    message: 'テスト通知2',
    relatedId: 'question2',
    isRead: true,
    isDeadlineNotified: false,
    createdAt: new Date('2023-01-02T00:00:00Z'),
  },
  {
    id: 'notification3',
    userId: 'user1',
    type: NotificationType.ANSWERED_QUESTION_CLOSED,
    message: 'テスト通知3',
    relatedId: 'question3',
    isRead: false,
    isDeadlineNotified: false,
    createdAt: new Date('2023-01-03T00:00:00Z'),
  },
];

// モックリクエスト作成関数
const createMockRequest = (queryParams: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/notifications');
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const request = new Request(url) as NextRequest;
  // nextUrlを設定（NextRequestの特殊なプロパティ）
  Object.defineProperty(request, 'nextUrl', {
    value: url,
    writable: true,
  });
  
  return request;
};

describe('通知一覧取得API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET - 通知一覧取得', () => {
    it('認証済みユーザーが自分の通知一覧を取得できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.notification.findMany.mockResolvedValue(
        mockNotifications.map(n => ({
          ...n,
          user: mockUser,
        })) as any
      );
      prismaMock.notification.count.mockResolvedValue(2); // 未読通知の数

      // リクエスト実行
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.notifications).toHaveLength(3);
      expect(data.totalUnread).toBe(2);
    });

    it('未読通知のみを取得できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // 未読通知のみをフィルタリングし、createdAtの降順で並べる
      const unreadNotifications = mockNotifications
        .filter(n => !n.isRead)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Prismaモック
      prismaMock.notification.findMany.mockResolvedValue(
        unreadNotifications.map(n => ({
          ...n,
          user: mockUser,
        })) as any
      );
      prismaMock.notification.count.mockResolvedValue(2); // 未読通知の数

      // リクエスト実行
      const request = createMockRequest({ unread: 'true' });
      const response = await GET(request);
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.notifications).toHaveLength(2); // 未読通知は2件
      // 日付降順なので、notification3（2023-01-03）が最初、notification1（2023-01-01）が次
      expect(data.notifications[0].id).toBe('notification3');
      expect(data.notifications[1].id).toBe('notification1');
      expect(data.totalUnread).toBe(2);
    });

    it('ページネーションが正しく動作すること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.notification.findMany.mockResolvedValue([
        {
          ...mockNotifications[0],
          user: mockUser,
        },
      ] as any);
      prismaMock.notification.count.mockResolvedValue(2); // 未読通知の数

      // リクエスト実行
      const request = createMockRequest({ limit: '1' });
      const response = await GET(request);
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.notifications).toHaveLength(1);
      expect(data.nextCursor).toBe('notification1'); // 次のカーソル
    });

    it('カーソルベースのページネーションが正しく動作すること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.notification.findMany.mockResolvedValue([
        {
          ...mockNotifications[1],
          user: mockUser,
        },
      ] as any);
      prismaMock.notification.count.mockResolvedValue(2); // 未読通知の数

      // リクエスト実行
      const request = createMockRequest({ 
        limit: '1',
        cursor: 'notification1' 
      });
      const response = await GET(request);
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.notifications).toHaveLength(1);
      expect(data.notifications[0].id).toBe('notification2');
    });

    it('非認証ユーザーが通知一覧を取得しようとすると401を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(null);

      // リクエスト実行
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('エラー発生時は500を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモックでエラーをスロー
      prismaMock.notification.findMany.mockRejectedValue(new Error('Database error'));

      // リクエスト実行
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
}); 