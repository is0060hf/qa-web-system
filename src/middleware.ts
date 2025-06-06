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

// CORS設定（環境変数の検証を含む）
const ALLOWED_ORIGINS = (() => {
  const origins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
  return origins.length > 0 ? origins : ['http://localhost:3000'];
})();
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
const ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'X-CSRF-Token'];

// レート制限の設定（LRUキャッシュ風の実装）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_RATE_LIMIT_ENTRIES = 10000; // 最大エントリ数を制限
const RATE_LIMIT_WINDOW = Math.max(1000, parseInt(process.env.RATE_LIMIT_WINDOW || '60000') || 60000);
const RATE_LIMIT_MAX_REQUESTS = Math.max(1, parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100') || 100);

// CSRFトークンの検証が必要なメソッド
const CSRF_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// CSPヘッダーの設定（環境に応じて調整）
const getCSPDirectives = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 本番環境ではより厳格なCSPを適用
  const directives = [
    "default-src 'self'",
    `script-src 'self' ${isDevelopment ? "'unsafe-inline' 'unsafe-eval'" : ""} https://vercel.live`,
    `style-src 'self' ${isDevelopment ? "'unsafe-inline'" : ""} https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${isDevelopment ? 'ws://localhost:* http://localhost:*' : ''} https://vercel.live wss://ws-us3.pusher.com https://sockjs-us3.pusher.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];
  
  // 開発環境でのみReact DevToolsを許可
  if (isDevelopment) {
    directives.push("script-src-elem 'self' 'unsafe-inline'");
  }
  
  return directives.filter(Boolean).join('; ');
};

// レート制限のチェック
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  
  // 定期的にクリーンアップを実行（100リクエストごと）
  if (Math.random() < 0.01) {
    cleanupRateLimitMap();
  }
  
  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || userLimit.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

// 古いレート制限エントリのクリーンアップ（リクエスト時に実行）
function cleanupRateLimitMap() {
  const now = Date.now();
  
  // エントリ数が多すぎる場合は古いものから削除（LRU風）
  if (rateLimitMap.size > MAX_RATE_LIMIT_ENTRIES) {
    const entries = Array.from(rateLimitMap.entries())
      .sort((a, b) => a[1].resetTime - b[1].resetTime);
    
    // 古いエントリを削除して制限内に収める
    const deleteCount = rateLimitMap.size - Math.floor(MAX_RATE_LIMIT_ENTRIES * 0.9);
    for (let i = 0; i < deleteCount && i < entries.length; i++) {
      rateLimitMap.delete(entries[i][0]);
    }
  }
  
  // 期限切れのエントリを削除
  const expiredKeys: string[] = [];
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      expiredKeys.push(key);
    }
  }
  
  // バッチで削除（パフォーマンス向上）
  expiredKeys.forEach(key => rateLimitMap.delete(key));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');
  const method = request.method;

  console.log(`[Middleware] Processing request for: ${pathname}`);

  // レスポンスヘッダーの準備
  const responseHeaders = new Headers();

  // CORS設定
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    responseHeaders.set('Access-Control-Allow-Origin', origin);
    responseHeaders.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
    responseHeaders.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  }

  // プリフライトリクエストの処理
  if (method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: responseHeaders });
  }

  // CSPヘッダーの設定
  responseHeaders.set('Content-Security-Policy', getCSPDirectives());
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('X-Frame-Options', 'DENY');
  responseHeaders.set('X-XSS-Protection', '1; mode=block');

  // APIエンドポイントでない場合はスキップ
  if (!pathname.startsWith('/api/')) {
    console.log(`[Middleware] Not an API endpoint: ${pathname}`);
    return NextResponse.next({
      headers: responseHeaders,
    });
  }

  // レート制限のチェック
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimitIdentifier = `${clientIp}-${pathname}`;
  
  if (!checkRateLimit(rateLimitIdentifier)) {
    console.log(`[Middleware] Rate limit exceeded for: ${rateLimitIdentifier}`);
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { 
        status: 429,
        headers: {
          ...responseHeaders,
          'Retry-After': '60',
          'Content-Type': 'application/json',
        }
      }
    );
  }

  // CSRF保護（APIエンドポイントかつ状態を変更するメソッドの場合）
  if (CSRF_METHODS.includes(method) && !PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionCsrfToken = request.cookies.get('csrf-token-session')?.value;

    if (!csrfToken || !sessionCsrfToken || csrfToken !== sessionCsrfToken) {
      console.log(`[Middleware] CSRF token validation failed for: ${pathname}`);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        { 
          status: 403,
          headers: {
            ...responseHeaders,
            'Content-Type': 'application/json',
          }
        }
      );
    }
  }

  // 認証不要なパスの場合はスキップ（完全一致または末尾がスラッシュの場合のみ）
  if (PUBLIC_PATHS.some(path => {
    // 完全一致、またはパスの後にスラッシュが続く場合のみマッチ
    return pathname === path || pathname.startsWith(path + '/');
  })) {
    console.log(`[Middleware] Public path: ${pathname}, skipping authentication`);
    return NextResponse.next({
      headers: responseHeaders,
    });
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
      return new NextResponse(JSON.stringify(null), { 
        status: 200,
        headers: {
          ...responseHeaders,
          'Content-Type': 'application/json',
        }
      });
    }
    
    // トークンがある場合は検証 (非同期)
    const payload = await verifyTokenEdge(token);
    console.log(`[Middleware] /api/auth/me token verification: ${payload ? 'Valid' : 'Invalid'}`);
    
    if (!payload) {
      // 無効なトークンの場合はnull
      console.log(`[Middleware] /api/auth/me invalid token, returning null`);
      return new NextResponse(JSON.stringify(null), { 
        status: 200,
        headers: {
          ...responseHeaders,
          'Content-Type': 'application/json',
        }
      });
    }
    
    // ユーザー情報をヘッダーに追加
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);
    console.log(`[Middleware] /api/auth/me added user info, proceeding`);
    
    // レスポンスヘッダーも追加
    Object.entries(Object.fromEntries(responseHeaders.entries())).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });
    
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
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: {
            ...responseHeaders,
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    // トークンがある場合は検証 (非同期)
    const payload = await verifyTokenEdge(token);
    console.log(`[Middleware] Token verification for ${pathname}: ${payload ? 'Valid' : 'Invalid'}`);
    
    if (!payload) {
      // トークンが無効
      console.log(`[Middleware] Invalid token for protected path: ${pathname}`);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401,
          headers: {
            ...responseHeaders,
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    // ユーザー情報をヘッダーに追加
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);
    console.log(`[Middleware] Added user info for protected path: ${pathname}`);
    
    // レスポンスヘッダーも追加
    Object.entries(Object.fromEntries(responseHeaders.entries())).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // それ以外のリクエストはそのまま通す
  console.log(`[Middleware] Path not in protected list: ${pathname}, proceeding without auth check`);
  return NextResponse.next({
    headers: responseHeaders,
  });
}

export const config = {
  matcher: '/api/:path*',
}; 