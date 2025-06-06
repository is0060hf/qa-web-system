import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateRequest } from '@/lib/utils/api';
import { z } from 'zod';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/utils/email';

// リクエストスキーマ
const requestPasswordResetSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

export async function POST(req: NextRequest) {
  try {
    // リクエストのバリデーション
    const validation = await validateRequest(req, requestPasswordResetSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { email } = validation.data;

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // セキュリティのため、ユーザーが存在しない場合も成功レスポンスを返す
    if (!user) {
      return NextResponse.json({
        message: 'パスワードリセットのメールを送信しました。メールをご確認ください。'
      });
    }

    // リセットトークンの生成（32バイトのランダム文字列）
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // トークンの有効期限（1時間）
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // 既存のリセットトークンがあれば削除
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    // 新しいリセットトークンを作成
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    // メール送信処理
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${resetToken}`;
    
    // メールを送信
    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({
      message: 'パスワードリセットのメールを送信しました。メールをご確認ください。'
    });
  } catch (error) {
    console.error('パスワードリセット要求エラー:', error);
    return NextResponse.json(
      { error: 'パスワードリセット要求の処理に失敗しました' },
      { status: 500 }
    );
  }
} 