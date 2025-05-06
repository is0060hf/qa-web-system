import { NextRequest, NextResponse } from 'next/server';
import { POST as requestReset, PATCH as executeReset } from '@/app/api/auth/reset-password/route';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// NextResponse.jsonをモック
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((body, init) => ({
        body,
        status: init?.status || 200,
      })),
    },
  };
});

// 認証関連の関数をモック
jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(),
}));

// cryptoのランダムバイト生成関数をモック
jest.mock('crypto', () => {
  return {
    ...jest.requireActual('crypto'),
    randomBytes: jest.fn(() => ({
      toString: jest.fn(() => 'mock-reset-token'),
    })),
  };
});

describe('Password Reset API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/reset-password (Request Reset)', () => {
    it('should generate reset token for existing user', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      // モック設定
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'test@example.com',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await requestReset(req);

      // ユーザー検索が行われたことを確認
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: reqBody.email },
      });

      // 成功レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'パスワードリセットの手順をメールで送信しました');
      
      // 開発用の情報を含むこと（実際の本番環境では削除される）
      expect(response.body).toHaveProperty('debug');
      expect(response.body.debug).toHaveProperty('resetToken', 'mock-reset-token');
      expect(response.body.debug).toHaveProperty('tokenExpiry');
    });

    it('should handle reset request for non-existent email gracefully', async () => {
      // ユーザーが見つからないことをモック
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'nonexistent@example.com',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await requestReset(req);

      // ユーザー検索が行われたことを確認
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: reqBody.email },
      });

      // セキュリティ上、ユーザーが存在しなくても同じ成功レスポンスを返す
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'パスワードリセットの手順をメールで送信しました');
      // 本物のリセットトークンは含まれない
    });

    it('should validate email format', async () => {
      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // 無効なリクエストボディ
      const reqBody = {
        // emailがない
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await requestReset(req);

      // ユーザー検索が行われていないことを確認
      expect(prisma.user.findUnique).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors during reset request', async () => {
      // エラーをモック
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'test@example.com',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await requestReset(req);

      // エラーログが出力されたことを確認
      expect(consoleSpy).toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');

      // スパイをリセット
      consoleSpy.mockRestore();
    });
  });

  describe('PATCH /api/auth/reset-password (Execute Reset)', () => {
    it('should reset password with valid token', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      // モックハッシュパスワード
      const hashedPassword = 'new-hashed-password';

      // モック設定
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/reset-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'test@example.com',
        token: 'valid-reset-token',
        newPassword: 'NewSecurePassword123',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await executeReset(req);

      // パスワードハッシュ化が行われたことを確認
      expect(hashPassword).toHaveBeenCalledWith(reqBody.newPassword);
      
      // ユーザー更新が行われたことを確認
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: reqBody.email },
        data: {
          passwordHash: hashedPassword,
        },
        select: {
          id: true,
          email: true,
        },
      });

      // 成功レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'パスワードが正常にリセットされました');
      expect(response.body).toHaveProperty('user', mockUser);
    });

    it('should validate required fields for password reset', async () => {
      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/reset-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // 不完全なリクエストボディ
      const reqBody = {
        email: 'test@example.com',
        // tokenが不足
        newPassword: 'NewPassword123',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await executeReset(req);

      // ハッシュ化や更新が行われていないことを確認
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate new password length', async () => {
      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/reset-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // 短すぎるパスワードのリクエストボディ
      const reqBody = {
        email: 'test@example.com',
        token: 'valid-token',
        newPassword: 'short', // 8文字未満
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await executeReset(req);

      // ハッシュ化や更新が行われていないことを確認
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors during password reset', async () => {
      // エラーをモック
      (hashPassword as jest.Mock).mockRejectedValue(new Error('Hashing error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/reset-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'test@example.com',
        token: 'valid-token',
        newPassword: 'NewSecurePassword123',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await executeReset(req);

      // エラーログが出力されたことを確認
      expect(consoleSpy).toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');

      // スパイをリセット
      consoleSpy.mockRestore();
    });
  });
}); 