import { NextRequest } from 'next/server';
import { prismaMock } from '@/../jest/singleton';
import * as apiUtils from '@/lib/utils/api';
import { PATCH, DELETE } from '@/app/api/notifications/[notificationId]/route';
import { Notification, User, Role, NotificationType } from '@prisma/client';

// モックデータ
const mockUser: User = {
  id: 'user1',
  name: 'テストユーザー',
  email: 'test@example.com',
  role: Role.USER,
  password: 'hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOtherUser: User = {
  id: 'user2',
  name: '別のユーザー',
  email: 'other@example.com',
  role: Role.USER,
  password: 'hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockNotification: Notification = {
  id: 'notification1',
  userId: 'user1',
  type: NotificationType.NEW_QUESTION_ASSIGNED,
  message: 'テスト通知',
  relatedId: 'question1',
  isRead: false,
  isDeadlineNotified: false,
  createdAt: new Date(),
};

// モックリクエスト作成関数
const createMockRequest = (method: string, body?: any) => {
  const request = new Request('http://localhost/api/notifications/notification1', {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  }) as NextRequest;
  return request;
};

describe('通知更新・削除API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH - 通知の既読/未読設定', () => {
    it('ユーザーが自分の通知を既読に設定できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // req.jsonのモック
      jest.spyOn(Request.prototype, 'json').mockResolvedValue({ isRead: true });

      // Prismaモック
      prismaMock.notification.findUnique.mockResolvedValue(mockNotification);
      prismaMock.notification.update.mockResolvedValue({
        ...mockNotification,
        isRead: true,
      });

      // リクエスト実行
      const request = createMockRequest('PATCH', { isRead: true });
      const response = await PATCH(request, { params: { notificationId: 'notification1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.id).toBe('notification1');
      expect(data.isRead).toBe(true);
    });

    it('ユーザーが自分の通知を未読に設定できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // req.jsonのモック
      jest.spyOn(Request.prototype, 'json').mockResolvedValue({ isRead: false });

      // Prismaモック
      prismaMock.notification.findUnique.mockResolvedValue({
        ...mockNotification,
        isRead: true,
      });
      prismaMock.notification.update.mockResolvedValue({
        ...mockNotification,
        isRead: false,
      });

      // リクエスト実行
      const request = createMockRequest('PATCH', { isRead: false });
      const response = await PATCH(request, { params: { notificationId: 'notification1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.id).toBe('notification1');
      expect(data.isRead).toBe(false);
    });

    it('指定がない場合はデフォルトで既読になること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // req.jsonのモック
      jest.spyOn(Request.prototype, 'json').mockResolvedValue({});

      // Prismaモック
      prismaMock.notification.findUnique.mockResolvedValue(mockNotification);
      prismaMock.notification.update.mockResolvedValue({
        ...mockNotification,
        isRead: true,
      });

      // リクエスト実行
      const request = createMockRequest('PATCH', {});
      const response = await PATCH(request, { params: { notificationId: 'notification1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.isRead).toBe(true);
    });

    it('他のユーザーの通知を更新しようとすると403を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockOtherUser);

      // req.jsonのモック
      jest.spyOn(Request.prototype, 'json').mockResolvedValue({ isRead: true });

      // Prismaモック
      prismaMock.notification.findUnique.mockResolvedValue(mockNotification);

      // リクエスト実行
      const request = createMockRequest('PATCH', { isRead: true });
      const response = await PATCH(request, { params: { notificationId: 'notification1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('存在しない通知を更新しようとすると404を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // req.jsonのモック
      jest.spyOn(Request.prototype, 'json').mockResolvedValue({ isRead: true });

      // Prismaモック
      prismaMock.notification.findUnique.mockResolvedValue(null);

      // リクエスト実行
      const request = createMockRequest('PATCH', { isRead: true });
      const response = await PATCH(request, { params: { notificationId: 'nonexistent' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('非認証ユーザーが通知を更新しようとすると401を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(null);

      // リクエスト実行
      const request = createMockRequest('PATCH', { isRead: true });
      const response = await PATCH(request, { params: { notificationId: 'notification1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });

  describe('DELETE - 通知削除', () => {
    it('ユーザーが自分の通知を削除できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.notification.findUnique.mockResolvedValue(mockNotification);
      prismaMock.notification.delete.mockResolvedValue(mockNotification);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { notificationId: 'notification1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
    });

    it('他のユーザーの通知を削除しようとすると403を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockOtherUser);

      // Prismaモック
      prismaMock.notification.findUnique.mockResolvedValue(mockNotification);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { notificationId: 'notification1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('存在しない通知を削除しようとすると404を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.notification.findUnique.mockResolvedValue(null);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { notificationId: 'nonexistent' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('非認証ユーザーが通知を削除しようとすると401を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(null);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { notificationId: 'notification1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });
}); 