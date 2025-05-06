import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import { generateTestToken } from '../utils/test-helpers';
import { Role } from '@prisma/client';

// NextResponse.nextとjsonのモック
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      next: jest.fn().mockImplementation((options) => ({
        type: 'next',
        request: options?.request || undefined,
      })),
      json: jest.fn((body, init) => ({
        body,
        status: init?.status || 200,
      })),
    },
  };
});

describe('Auth Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Protected API Routes', () => {
    it('should pass requests for public routes without authentication', async () => {
      // 認証不要の公開APIルートへのリクエスト
      const req = new NextRequest('https://example.com/api/auth/login', {
        method: 'POST',
      });
      
      // ミドルウェア実行
      const response = await middleware(req);
      
      // NextResponse.nextが呼ばれていることを確認
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toHaveProperty('type', 'next');
      
      // jsonが呼ばれていないことを確認（認証エラーなし）
      expect(NextResponse.json).not.toHaveBeenCalled();
    });

    it('should require authentication for protected API routes', async () => {
      // 認証が必要なAPIルートへの未認証リクエスト
      const req = new NextRequest('https://example.com/api/projects', {
        method: 'GET',
      });
      
      // ミドルウェア実行
      const response = await middleware(req);
      
      // 認証エラー応答が返されることを確認
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: expect.any(String) },
        { status: 401 }
      );
    });

    it('should reject invalid tokens for protected routes', async () => {
      // 無効なトークンを持つリクエスト
      const req = new NextRequest('https://example.com/api/projects', {
        method: 'GET',
        headers: {
          'authorization': 'Bearer invalid-token',
        },
      });
      
      // ミドルウェア実行
      const response = await middleware(req);
      
      // 認証エラー応答が返されることを確認
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: expect.any(String) },
        { status: 401 }
      );
    });

    it('should allow access with valid authentication token', async () => {
      // 有効なトークンを生成
      const token = generateTestToken('test-user-id', 'test@example.com', Role.USER);
      
      // 認証済みリクエスト
      const req = new NextRequest('https://example.com/api/projects', {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${token}`,
        },
      });
      
      // ミドルウェア実行
      const response = await middleware(req);
      
      // NextResponse.nextが呼ばれていることを確認
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toHaveProperty('type', 'next');
      
      // リクエストヘッダーにユーザー情報が追加されていることを確認
      const nextOptions = (NextResponse.next as jest.Mock).mock.calls[0][0];
      expect(nextOptions).toHaveProperty('request.headers');
      
      // jsonが呼ばれていないことを確認（認証エラーなし）
      expect(NextResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('Non-API Routes', () => {
    it('should ignore non-API routes', async () => {
      // API以外のルートへのリクエスト
      const req = new NextRequest('https://example.com/dashboard', {
        method: 'GET',
      });
      
      // ミドルウェア実行
      const response = await middleware(req);
      
      // NextResponse.nextが呼ばれていることを確認
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toHaveProperty('type', 'next');
      
      // jsonが呼ばれていないことを確認
      expect(NextResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('User Information in Headers', () => {
    it('should add user information to request headers', async () => {
      // テストユーザー情報
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const role = Role.ADMIN;
      
      // 有効なトークンを生成
      const token = generateTestToken(userId, email, role);
      
      // 認証済みリクエスト
      const req = new NextRequest('https://example.com/api/users', {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${token}`,
        },
      });
      
      // ミドルウェア実行
      await middleware(req);
      
      // NextResponse.nextの呼び出し引数を取得
      const nextOptions = (NextResponse.next as jest.Mock).mock.calls[0][0];
      const headers = nextOptions.request.headers;
      
      // ユーザー情報がヘッダーに追加されていることを確認
      expect(headers.get('x-user-id')).toBe(userId);
      expect(headers.get('x-user-email')).toBe(email);
      expect(headers.get('x-user-role')).toBe(role);
    });
  });
}); 