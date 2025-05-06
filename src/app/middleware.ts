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

// 認証不要のパス
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
  
  // 認証トークンが存在するか確認
  const authToken = request.cookies.get('authToken')?.value;
  
  // パブリックパスへのアクセスでトークンが存在する場合はダッシュボードへリダイレクト
  // （ログイン済みユーザーがログインページにアクセスした場合など）
  if (
    publicPaths.some(path => pathname.startsWith(path)) && 
    authToken
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // 保護されたパスへのアクセスでトークンが存在しない場合はログインページへリダイレクト
  if (
    protectedPaths.some(path => pathname.startsWith(path)) && 
    !authToken
  ) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // トップページへのアクセスでトークンが存在しない場合はログインページへリダイレクト
  if (pathname === '/' && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
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