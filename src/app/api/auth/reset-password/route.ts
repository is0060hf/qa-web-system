import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/db';
import { validateRequest } from '@/lib/utils/api';
import { z } from 'zod';
import crypto from 'crypto';

// パスワードリセット実行のスキーマ
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'トークンは必須です'),
  newPassword: z.string().min(8, 'パスワードは8文字以上である必要があります'),
});

// パスワードリセット実行
export async function POST(req: NextRequest) {
  try {
    // リクエストのバリデーション
    const validation = await validateRequest(req, resetPasswordSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { token, newPassword } = validation.data;

    // トークンをハッシュ化
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // トークンの有効性を確認
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!passwordResetToken) {
      return NextResponse.json(
        { error: '無効なトークンです' },
        { status: 400 }
      );
    }

    // トークンの有効期限を確認
    if (passwordResetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'トークンの有効期限が切れています' },
        { status: 400 }
      );
    }

    // トークンが既に使用されているか確認
    if (passwordResetToken.usedAt) {
      return NextResponse.json(
        { error: 'このトークンは既に使用されています' },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await hashPassword(newPassword);

    // トランザクションでパスワード更新とトークンの使用済み設定を実行
    await prisma.$transaction(async (tx) => {
      // パスワードを更新
      await tx.user.update({
        where: { id: passwordResetToken.userId },
        data: {
          passwordHash: hashedPassword,
        },
      });

      // トークンを使用済みに設定
      await tx.passwordResetToken.update({
        where: { id: passwordResetToken.id },
        data: {
          usedAt: new Date(),
        },
      });

      // 他の未使用のトークンがあれば削除
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: passwordResetToken.userId,
          usedAt: null,
          id: { not: passwordResetToken.id },
        },
      });
    });

    return NextResponse.json({
      message: 'パスワードが正常にリセットされました',
    });
  } catch (error) {
    console.error('パスワードリセット実行エラー:', error);
    return NextResponse.json(
      { error: 'パスワードリセットに失敗しました' },
      { status: 500 }
    );
  }
}

// パスワードリセットトークン生成リクエスト
export async function PATCH(request: Request) {
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