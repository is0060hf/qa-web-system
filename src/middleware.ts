import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge, getTokenFromHeaderEdge } from './lib/auth/edge-jwt';

// 認証が必要なAPIパス
const AUTH_REQUIRED_PATHS = [
  '/api/projects',
  '/api/questions',
  '/api/answers',
  '/api/users',
  '/api/invitations',
  '/api/notifications',
  '/api/dashboard',
  '/api/answer-form-templates',
  '/api/media',
  '/api/attachments',
];

// 認証不要なAPIパス
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/media/upload', // Vercel Blob client uploadのため
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`[Middleware] Processing request for: ${pathname}`);

  // APIエンドポイントでない場合はスキップ
  if (!pathname.startsWith('/api/')) {
    console.log(`[Middleware] Not an API endpoint: ${pathname}`);
    return NextResponse.next();
  }

  // 認証不要なパスの場合はスキップ（完全一致または末尾がスラッシュの場合のみ）
  if (PUBLIC_PATHS.some(path => {
    // 完全一致、またはパスの後にスラッシュが続く場合のみマッチ
    return pathname === path || pathname.startsWith(path + '/');
  })) {
    console.log(`[Middleware] Public path: ${pathname}, skipping authentication`);
    return NextResponse.next();
  }

  // トークンの取得
  const authorization = request.headers.get('authorization');
  console.log(`[Middleware] Authorization header: ${authorization ? 'Present' : 'Missing'}`);
  const token = getTokenFromHeaderEdge(authorization || '');
  console.log(`[Middleware] Token extracted: ${token ? 'Valid format' : 'Missing or invalid format'}`);

  // auth/meエンドポイントの特殊処理：トークンがなくても401ではなくnullを返す
  if (pathname === '/api/auth/me') {
    console.log(`[Middleware] /api/auth/me special handling`);
    
    if (!token) {
      console.log(`[Middleware] /api/auth/me called without token, returning null`);
      return NextResponse.json(null, { status: 200 });
    }
    
    // トークンがある場合は検証 (非同期)
    const payload = await verifyTokenEdge(token);
    console.log(`[Middleware] /api/auth/me token verification: ${payload ? 'Valid' : 'Invalid'}`);
    
    if (!payload) {
      // 無効なトークンの場合はnull
      console.log(`[Middleware] /api/auth/me invalid token, returning null`);
      return NextResponse.json(null, { status: 200 });
    }
    
    // ユーザー情報をヘッダーに追加
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);
    console.log(`[Middleware] /api/auth/me added user info, proceeding`);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // auth/me以外の認証が必要なパスの場合はトークン必須
  if (AUTH_REQUIRED_PATHS.some(path => pathname.startsWith(path))) {
    console.log(`[Middleware] Protected path detected: ${pathname}`);
    
    if (!token) {
      console.log(`[Middleware] Protected path: ${pathname} called without token, returning 401`);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // トークンがある場合は検証 (非同期)
    const payload = await verifyTokenEdge(token);
    console.log(`[Middleware] Token verification for ${pathname}: ${payload ? 'Valid' : 'Invalid'}`);
    
    if (!payload) {
      // トークンが無効
      console.log(`[Middleware] Invalid token for protected path: ${pathname}`);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // ユーザー情報をヘッダーに追加
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);
    console.log(`[Middleware] Added user info for protected path: ${pathname}`);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // それ以外のリクエストはそのまま通す
  console.log(`[Middleware] Path not in protected list: ${pathname}, proceeding without auth check`);
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}; 