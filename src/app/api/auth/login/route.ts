import { NextResponse } from 'next/server';
import { verifyPassword, generateToken } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // バリデーション
    if (!email || !password) {
      return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 });
    }

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 });
    }

    // パスワード検証
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 });
    }

    // JWTトークン生成
    const token = generateToken(user);

    // ユーザー情報を返す（パスワードハッシュは除外）
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return NextResponse.json({
      message: 'ログインに成功しました',
      token,
      user: userData
    });
  } catch (error) {
    console.error('ログインエラー:', error);
    return NextResponse.json(
      { error: 'ログインに失敗しました。しばらくしてからもう一度お試しください。' },
      { status: 500 }
    );
  }
} 