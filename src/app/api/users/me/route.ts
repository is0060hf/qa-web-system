import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/utils/api';
import prisma from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { z } from 'zod';

// ユーザー自身の情報を取得
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // データベースから最新のユーザー情報を取得
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ユーザー情報更新スキーマ
const updateUserSchema = z.object({
  name: z.string().max(100, '名前は100文字以内で入力してください').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, '新しいパスワードは8文字以上で入力してください').optional(),
});

// ログインユーザー情報更新
export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストデータの解析
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'リクエストボディが不正です' },
        { status: 400 }
      );
    }

    // バリデーション
    let data;
    try {
      data = updateUserSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'バリデーションエラー', details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }

    // パスワード変更のために現在のパスワードを取得
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 更新用データの準備
    const updateData: any = {};

    // 名前の更新
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    // パスワードの更新
    if (data.newPassword) {
      // パスワード変更時は現在のパスワードが必要
      if (!data.currentPassword) {
        return NextResponse.json(
          { error: 'パスワードを変更するには現在のパスワードが必要です' },
          { status: 400 }
        );
      }

      // 現在のパスワードの検証
      const isValidPassword = await verifyPassword(
        data.currentPassword,
        dbUser.passwordHash
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 401 }
        );
      }

      // 新しいパスワードのハッシュ化
      updateData.passwordHash = await hashPassword(data.newPassword);
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新するデータがありません' },
        { status: 400 }
      );
    }

    // ユーザー情報の更新
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'ユーザー情報を更新しました',
      user: updatedUser,
    });
  } catch (error) {
    console.error('ユーザー情報更新エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の更新に失敗しました' },
      { status: 500 }
    );
  }
} 