import { NextRequest, NextResponse } from 'next/server';
import { POST as register } from '@/app/api/auth/register/route';
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

describe('Register API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      // モックハッシュパスワード
      const hashedPassword = 'hashed-password-123';

      // モック新規ユーザー
      const newUser = {
        id: 'user-123',
        email: 'new@example.com',
        name: 'New User',
        role: 'USER',
        createdAt: new Date(),
      };

      // モック設定
      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // 既存ユーザーなし
      (prisma.user.create as jest.Mock).mockResolvedValue(newUser);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'new@example.com',
        password: 'Password123',
        name: 'New User',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await register(req);

      // ユーザー存在チェックが行われたことを確認
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: reqBody.email },
      });
      
      // パスワードハッシュ化が行われたことを確認
      expect(hashPassword).toHaveBeenCalledWith(reqBody.password);
      
      // ユーザー作成が行われたことを確認
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: reqBody.email,
          passwordHash: hashedPassword,
          name: reqBody.name,
        },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        }),
      });

      // レスポンス検証
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'ユーザー登録が完了しました');
      expect(response.body).toHaveProperty('user', newUser);
    });

    it('should register a user without name', async () => {
      // モックハッシュパスワード
      const hashedPassword = 'hashed-password-123';

      // モック新規ユーザー（名前なし）
      const newUser = {
        id: 'user-123',
        email: 'noname@example.com',
        name: null,
        role: 'USER',
        createdAt: new Date(),
      };

      // モック設定
      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(newUser);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック（名前なし）
      const reqBody = {
        email: 'noname@example.com',
        password: 'Password123',
        // 名前が省略されている
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await register(req);

      // ユーザー作成が行われたことを確認（nameがnullで渡される）
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: reqBody.email,
          passwordHash: hashedPassword,
          name: null,
        },
        select: expect.any(Object),
      });

      // 成功レスポンス検証
      expect(response.status).toBe(201);
    });

    it('should reject registration with missing required fields', async () => {
      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // 不完全なリクエストボディ（パスワードなし）
      const reqBody = {
        email: 'test@example.com',
        // パスワードがない
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await register(req);

      // ハッシュ化や作成が行われていないことを確認
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with invalid email format', async () => {
      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // 無効なメール形式のリクエストボディ
      const reqBody = {
        email: 'invalid-email', // @がない
        password: 'Password123',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await register(req);

      // ハッシュ化や作成が行われていないことを確認
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with short password', async () => {
      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // 短すぎるパスワードのリクエストボディ
      const reqBody = {
        email: 'test@example.com',
        password: 'short', // 8文字未満
        name: 'Test User',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await register(req);

      // ハッシュ化や作成が行われていないことを確認
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration for existing email', async () => {
      // 既存ユーザーのモック
      const existingUser = {
        id: 'existing-user',
        email: 'existing@example.com',
        passwordHash: 'some-hash',
      };

      // 既存ユーザーが見つかることをモック
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // 既存ユーザーと同じメールアドレス
      const reqBody = {
        email: 'existing@example.com',
        password: 'Password123',
        name: 'New User',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await register(req);

      // ユーザー存在チェックが行われたことを確認
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: reqBody.email },
      });
      
      // ハッシュ化や作成が行われていないことを確認
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(409); // 競合
      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors during registration', async () => {
      // データベースエラーを模擬
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB connection error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await register(req);

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