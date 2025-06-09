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
 * グローバルモックのMockNextRequestを使用
 */
export function createMockRequest(
  method: string = 'GET',
  url: string = 'https://example.com/api/test',
  headers: Record<string, string> = {},
  body?: any
): any {
  // Mock implementation directly creates the object
  const mockRequest = new (global as any).Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  return mockRequest;
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
): any {
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
 * NextResponseオブジェクトを作成するヘルパー
 */
export function createMockResponse(data: any, status: number = 200, headers: Record<string, string> = {}) {
  const mockResponse = new (global as any).Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      ...headers
    }
  });

  return mockResponse;
}

/**
 * NextResponse.jsonの結果をシミュレート
 */
export function expectJsonResponse(response: any, expectedData: any, expectedStatus: number = 200) {
  expect(response.status).toBe(expectedStatus);
  
  // JSONレスポンスの内容をチェック
  if (typeof response.body === 'string') {
    expect(JSON.parse(response.body)).toEqual(expectedData);
  } else {
    expect(response.body).toEqual(expectedData);
  }
}

/**
 * モックのリセット
 */
export function resetMocks() {
  jest.restoreAllMocks();
} 