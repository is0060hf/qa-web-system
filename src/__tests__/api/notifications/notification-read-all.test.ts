import { NextRequest } from 'next/server';
import { prismaMock } from '@/../jest/singleton';
import * as apiUtils from '@/lib/utils/api';
import { POST } from '@/app/api/notifications/read-all/route';
import { User, Role } from '@prisma/client';

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

// モックリクエスト作成関数
const createMockRequest = () => {
  const request = new Request('http://localhost/api/notifications/read-all', {
    method: 'POST',
  }) as NextRequest;
  return request;
};

describe('通知一括既読API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - 通知一括既読', () => {
    it('認証済みユーザーが自分の全未読通知を一括で既読に設定できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.notification.updateMany.mockResolvedValue({ count: 5 });

      // リクエスト実行
      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.message).toContain('5件の未読通知を既読にしました');
      expect(data.count).toBe(5);

      // updateManyの呼び出し検証
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    });

    it('未読通知が0件の場合でも正常に実行されること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック - 0件の更新
      prismaMock.notification.updateMany.mockResolvedValue({ count: 0 });

      // リクエスト実行
      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.message).toContain('0件の未読通知を既読にしました');
      expect(data.count).toBe(0);
    });

    it('非認証ユーザーが通知を一括既読に設定しようとすると401を返すこと', async () => {
      // getUserFromRequestのモック - 未認証
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(null);

      // リクエスト実行
      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();

      // updateManyが呼ばれていないことを検証
      expect(prismaMock.notification.updateMany).not.toHaveBeenCalled();
    });

    it('エラー発生時は500を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモックでエラーをスロー
      prismaMock.notification.updateMany.mockRejectedValue(new Error('Database error'));

      // リクエスト実行
      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
}); 