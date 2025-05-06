import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

/**
 * テスト用のJWTトークンを生成
 */
export function generateTestToken(
  userId: string = 'test-user-id',
  email: string = 'test@example.com',
  role: string = Role.USER
): string {
  const payload = {
    userId,
    email,
    role
  };

  return jwt.sign(payload, process.env.JWT_SECRET as jwt.Secret, { expiresIn: '1h' });
}

/**
 * テスト用のNextRequestを作成
 */
export function createMockRequest(
  method: string = 'GET',
  url: string = 'https://example.com/api/test',
  headers: Record<string, string> = {},
  body?: any
): NextRequest {
  // ヘッダーの準備
  const requestHeaders = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    requestHeaders.set(key, value);
  });

  // リクエストの作成
  const request = new NextRequest(url, {
    method,
    headers: requestHeaders,
  });

  // リクエストをモック拡張
  if (body) {
    // @ts-ignore: NextRequestのjsonメソッドをモック
    request.json = jest.fn().mockResolvedValue(body);
  }

  return request;
}

/**
 * 認証済みリクエストを作成
 */
export function createAuthenticatedRequest(
  method: string = 'GET',
  url: string = 'https://example.com/api/test',
  userId: string = 'test-user-id',
  email: string = 'test@example.com',
  role: string = Role.USER,
  body?: any
): NextRequest {
  const token = generateTestToken(userId, email, role);

  return createMockRequest(
    method,
    url,
    {
      'authorization': `Bearer ${token}`,
      'x-user-id': userId,
      'x-user-email': email,
      'x-user-role': role,
    },
    body
  );
}

/**
 * NextResponseのjsonメソッドをモック
 */
export function mockNextResponseJson() {
  // NextResponse.jsonの元の実装を保存
  const originalJsonMethod = NextResponse.json;
  
  // モック実装で置き換え
  jest.spyOn(NextResponse, 'json').mockImplementation(
    (body: any, init?: ResponseInit) => {
      // 簡易的なNextResponseを返す
      const response = originalJsonMethod(body, init);
      
      // status とbody を簡単に取得できるように拡張
      Object.defineProperties(response, {
        status: {
          get: () => init?.status || 200,
        },
        body: {
          get: () => body,
        },
      });
      
      return response;
    }
  );
}

/**
 * モックのリセット
 */
export function resetMocks() {
  jest.restoreAllMocks();
} 