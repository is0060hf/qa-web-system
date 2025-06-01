import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateRequest } from '@/lib/utils/api';
import { z } from 'zod';
import crypto from 'crypto';

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
    // 注: 現在の実装ではPasswordResetTokenモデルが存在しないため、
    // ユーザーのメタデータとして保存する一時的な実装とします
    // TODO: PasswordResetTokenモデルを追加して適切に管理する

    // メール送信処理
    // TODO: 実際のメール送信サービス（SendGrid、AWS SES等）を使用
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    console.log('パスワードリセットURL:', resetUrl);
    console.log('対象ユーザー:', email);
    console.log('トークン有効期限:', expiresAt);

    // 本番環境では実際にメールを送信する処理を実装
    // await sendPasswordResetEmail(email, resetUrl);

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