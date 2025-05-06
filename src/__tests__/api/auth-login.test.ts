import { NextRequest, NextResponse } from 'next/server';
import { POST as login } from '@/app/api/auth/login/route';
import prisma from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

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
  verifyPassword: jest.fn(),
  generateToken: jest.fn(),
}));

describe('Login API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate a user with valid credentials', async () => {
      // モックユーザーデータ
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'USER',
      };

      // モックトークン
      const mockToken = 'generated-jwt-token';

      // モック設定
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue(mockToken);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'test@example.com',
        password: 'correct-password',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await login(req);

      // 期待する呼び出しを確認
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: reqBody.email },
      });
      
      expect(verifyPassword).toHaveBeenCalledWith(reqBody.password, mockUser.passwordHash);
      expect(generateToken).toHaveBeenCalledWith(mockUser);

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'ログインに成功しました');
      expect(response.body).toHaveProperty('token', mockToken);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', mockUser.id);
      expect(response.body.user).toHaveProperty('email', mockUser.email);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject login with missing credentials', async () => {
      // 必須フィールドが不足したリクエスト
      const req = new NextRequest('https://example.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // パスワードが不足したリクエストボディ
      const reqBody = {
        email: 'test@example.com',
        // パスワードが不足
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await login(req);

      // 検証が呼ばれていないことを確認
      expect(verifyPassword).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login for non-existent user', async () => {
      // 存在しないユーザーのリクエスト
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'nonexistent@example.com',
        password: 'some-password',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await login(req);

      // 検証が呼ばれていないことを確認
      expect(verifyPassword).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();

      // エラーレスポンス検証（セキュリティ上、存在しないメールアドレスでも同じエラーメッセージ）
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with incorrect password', async () => {
      // モックユーザーデータ
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'USER',
      };

      // モック設定
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(false); // パスワード検証失敗

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'test@example.com',
        password: 'wrong-password',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await login(req);

      // パスワード検証が呼ばれたことを確認
      expect(verifyPassword).toHaveBeenCalledWith(reqBody.password, mockUser.passwordHash);
      
      // トークン生成が呼ばれていないことを確認
      expect(generateToken).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors during login', async () => {
      // データベースエラーを模擬
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB connection error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'test@example.com',
        password: 'test-password',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await login(req);

      // エラーログが出力されたことを確認
      expect(consoleSpy).toHaveBeenCalled();

      // サーバーエラーレスポンス検証
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');

      // スパイをリセット
      consoleSpy.mockRestore();
    });
  });
}); 