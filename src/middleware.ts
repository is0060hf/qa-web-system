import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenFromHeader, verifyToken } from './lib/auth';

// 認証が必要なAPIパス
const AUTH_REQUIRED_PATHS = [
  '/api/projects',
  '/api/questions',
  '/api/answers',
  '/api/users',
  '/api/invitations',
  '/api/notifications',
];

// 認証不要なAPIパス
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // APIエンドポイントでない場合はスキップ
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 認証不要なパスの場合はスキップ
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 認証が必要なパスでない場合はスキップ
  if (!AUTH_REQUIRED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // トークンの取得
  const authorization = request.headers.get('authorization');
  const token = getTokenFromHeader(authorization || '');

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // トークンの検証
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  // ユーザー情報をヘッダーに追加して次のハンドラーに渡す
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/api/:path*',
}; 