import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';

// 全ての未読通知を既読にする
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 全ての未読通知を既読に更新
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      message: `${result.count}件の未読通知を既読にしました`,
      count: result.count,
    });
  } catch (error) {
    console.error('一括既読エラー:', error);
    return NextResponse.json(
      { error: '通知の一括既読に失敗しました' },
      { status: 500 }
    );
  }
} 