import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // バリデーション
    if (!email || !password) {
      return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 });
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '有効なメールアドレスを入力してください' }, { status: 400 });
    }

    // パスワードの長さチェック
    if (password.length < 8) {
      return NextResponse.json({ error: 'パスワードは8文字以上である必要があります' }, { status: 400 });
    }

    // 既存ユーザーのチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'このメールアドレスは既に使用されています' }, { status: 409 });
    }

    // パスワードのハッシュ化
    const hashedPassword = await hashPassword(password);

    // ユーザー作成
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: name || null, // 名前が未入力の場合はnull
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: 'ユーザー登録が完了しました', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました。しばらくしてからもう一度お試しください。' },
      { status: 500 }
    );
  }
} 