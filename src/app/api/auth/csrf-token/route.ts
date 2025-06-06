import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/utils/security';

export async function GET(request: NextRequest) {
  try {
    // CSRFトークンを生成
    const token = generateCSRFToken();
    
    // レスポンスを作成
    const response = NextResponse.json({ token }, { status: 200 });
    
    // CSRFトークンをDouble Submit Cookie パターンで実装
    // 1. HttpOnly Cookieに保存（セッション用）
    response.cookies.set('csrf-token-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24時間
    });
    
    // 2. 通常のCookieにも保存（JavaScriptで読み取り可能）
    response.cookies.set('csrf-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24時間
    });
    
    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
} 