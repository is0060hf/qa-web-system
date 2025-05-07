import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 認証が必要なパス
const protectedPaths = [
  '/projects',
  '/questions',
  '/answers',
  '/settings',
  '/search',
  '/notifications',
];

// 認証不要のパス（完全一致と前方一致のパスを含む）
const publicPaths = [
  '/login',
  '/register',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // APIルートは個別にハンドリングするためスキップ（/api/auth以外）
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }
  
  // 認証不要パスへのアクセスは常に許可
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    // 既にログイン済みの場合はダッシュボードへリダイレクト（ただしAPI呼び出しは除く）
    const authToken = request.cookies.get('authToken')?.value;
    if (authToken && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }
  
  // 認証トークンが存在するか確認
  const authToken = request.cookies.get('authToken')?.value;
  
  // 保護されたパスへのアクセスでトークンが存在しない場合はログインページへリダイレクト
  if (
    (protectedPaths.some(path => pathname.startsWith(path)) || pathname === '/') && 
    !authToken
  ) {
    // リダイレクト元のパスを保存してログイン後に戻れるようにする
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('reason', 'auth_required');
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    /*
     * マッチするパス:
     * - '/' (ホームページ)
     * - '/login' などの認証関連ページ
     * - '/projects', '/questions' などの保護されたページ
     * - '/api/auth/*' の認証API エンドポイント
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 