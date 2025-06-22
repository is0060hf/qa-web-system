import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';

// APIエンドポイントを動的レンダリングに強制
export const dynamic = 'force-dynamic';

// 通知一覧取得
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // クエリパラメータ
    const { searchParams } = req.nextUrl;
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor');

    // ページネーション用のクエリ条件
    const paginationParams: any = {
      take: limit,
      where: {
        userId: user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    };

    // カーソルベースのページネーション
    if (cursor) {
      paginationParams.cursor = {
        id: cursor,
      };
      paginationParams.skip = 1; // カーソル自体はスキップ
    }

    // 通知データ取得
    const notifications = await prisma.notification.findMany(paginationParams);

    // 次のカーソル
    const nextCursor =
      notifications.length > 0 && notifications.length === limit ? notifications[notifications.length - 1].id : null;

    // 未読通知の総数取得
    const totalUnread = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      nextCursor,
      totalUnread,
    });
  } catch (error) {
    console.error('通知一覧取得エラー:', error);
    return NextResponse.json(
      { error: '通知一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
} 