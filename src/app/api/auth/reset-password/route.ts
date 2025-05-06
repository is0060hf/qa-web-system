import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/db';
import crypto from 'crypto';

// パスワードリセットトークン生成リクエスト
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'メールアドレスは必須です' }, { status: 400 });
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // セキュリティ上、ユーザーが存在しない場合も成功レスポンスを返す
      return NextResponse.json({ message: 'パスワードリセットの手順をメールで送信しました' });
    }

    // リセットトークン生成
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1); // トークン有効期限1時間

    // 実際のアプリケーションでは、このトークンをデータベースに保存し、
    // メール送信サービスを使用してユーザーにリセットリンクを送信します
    // ここではシミュレーションとして、トークンを返すだけにします

    return NextResponse.json({
      message: 'パスワードリセットの手順をメールで送信しました',
      // 開発用に返す情報（本番では削除する）
      debug: {
        resetToken,
        tokenExpiry,
      },
    });
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    return NextResponse.json(
      { error: 'パスワードリセットに失敗しました。しばらくしてからもう一度お試しください。' },
      { status: 500 }
    );
  }
}

// パスワードリセット実行
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { email, token, newPassword } = body;

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: 'メールアドレス、トークン、新しいパスワードは必須です' },
        { status: 400 }
      );
    }

    // パスワードの長さチェック
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上である必要があります' },
        { status: 400 }
      );
    }

    // 実際のアプリケーションでは、ここでトークンの有効性を検証します
    // このシミュレーションでは、トークンの検証をスキップします

    // パスワードのハッシュ化
    const hashedPassword = await hashPassword(newPassword);

    // ユーザーのパスワードを更新
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hashedPassword,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return NextResponse.json({
      message: 'パスワードが正常にリセットされました',
      user: updatedUser,
    });
  } catch (error) {
    console.error('パスワードリセット実行エラー:', error);
    return NextResponse.json(
      { error: 'パスワードリセットに失敗しました。しばらくしてからもう一度お試しください。' },
      { status: 500 }
    );
  }
} 