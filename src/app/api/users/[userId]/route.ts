import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest, isAdminRequest } from '@/lib/utils/api';
import { z } from 'zod';

// ユーザー更新スキーマ
const updateUserSchema = z.object({
  name: z.string().max(100, '名前は100文字以内で入力してください').optional(),
  role: z.enum(['USER', 'ADMIN'], {
    errorMap: () => ({ message: '役割は USER または ADMIN である必要があります' }),
  }).optional(),
});

/**
 * 特定のユーザー情報を更新 (Admin専用)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 管理者権限チェック
    const isAdmin = isAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { userId } = params;

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

    // 更新するデータがない場合
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: '更新するデータがありません' },
        { status: 400 }
      );
    }

    // 更新対象のユーザーが存在するか確認
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 最終管理者の役割変更を防止
    if (data.role === 'USER' && existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: '最後の管理者の役割を変更することはできません' },
          { status: 400 }
        );
      }
    }

    // ユーザー情報の更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
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

/**
 * 特定のユーザーを削除 (Admin専用)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 管理者権限チェック
    const isAdmin = isAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { userId } = params;
    const currentUser = getUserFromRequest(req);

    // 自分自身の削除を防止
    if (currentUser?.id === userId) {
      return NextResponse.json(
        { error: '自分自身を削除することはできません' },
        { status: 400 }
      );
    }

    // 削除対象のユーザーが存在するか確認
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 最終管理者の削除を防止
    if (existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: '最後の管理者を削除することはできません' },
          { status: 400 }
        );
      }
    }

    // ユーザーの削除
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: 'ユーザーを削除しました',
    });
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    return NextResponse.json(
      { error: 'ユーザーの削除に失敗しました' },
      { status: 500 }
    );
  }
} 