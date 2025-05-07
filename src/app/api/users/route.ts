import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest, isAdminRequest } from '@/lib/utils/api';
import { Prisma } from '@prisma/client';

/**
 * ユーザー一覧を取得 (Admin専用)
 */
export async function GET(req: NextRequest) {
  try {
    // 管理者権限チェック
    const isAdmin = isAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    // クエリパラメータの取得
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // 検索条件
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    // ユーザー総数の取得
    const total = await prisma.user.count({ where });

    // ユーザー一覧の取得
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
} 