import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';

// 通知既読/未読設定
export async function PATCH(
  req: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { notificationId } = params;
    const { isRead } = await req.json();

    // 通知の存在確認
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: '通知が見つかりません' },
        { status: 404 }
      );
    }

    // 自分宛ての通知かチェック
    if (notification.userId !== user.id) {
      return NextResponse.json(
        { error: 'この通知へのアクセス権限がありません' },
        { status: 403 }
      );
    }

    // 通知の既読/未読状態を更新
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: isRead === undefined ? true : isRead, // 明示的に指定がなければ既読にする
      },
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('通知更新エラー:', error);
    return NextResponse.json(
      { error: '通知の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 通知削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { notificationId } = params;

    // 通知の存在確認
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: '通知が見つかりません' },
        { status: 404 }
      );
    }

    // 自分宛ての通知かチェック
    if (notification.userId !== user.id) {
      return NextResponse.json(
        { error: 'この通知へのアクセス権限がありません' },
        { status: 403 }
      );
    }

    // 通知の削除
    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({
      message: '通知が正常に削除されました',
    });
  } catch (error) {
    console.error('通知削除エラー:', error);
    return NextResponse.json(
      { error: '通知の削除に失敗しました' },
      { status: 500 }
    );
  }
} 