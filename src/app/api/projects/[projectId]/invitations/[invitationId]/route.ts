import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { canManageProject } from '@/lib/utils/auth';
import { InvitationStatus } from '@prisma/client';

// 招待キャンセル
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; invitationId: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, invitationId } = await params;
    
    // 招待の存在確認
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '招待が見つかりません' },
        { status: 404 }
      );
    }

    // 招待が指定されたプロジェクトのものか確認
    if (invitation.projectId !== projectId) {
      return NextResponse.json(
        { error: '指定されたプロジェクトの招待ではありません' },
        { status: 400 }
      );
    }

    // 招待の状態確認
    if (invitation.status !== InvitationStatus.PENDING) {
      return NextResponse.json(
        { error: '進行中の招待のみキャンセルできます' },
        { status: 400 }
      );
    }

    // 権限チェック: 管理者権限を持つか、招待を送信したユーザー自身
    if (user.role !== 'ADMIN' && invitation.inviterId !== user.id) {
      // プロジェクト管理権限をチェック
      const accessCheck = await canManageProject(projectId, user);
      if (!accessCheck.success) {
        return NextResponse.json(
          { error: 'この招待をキャンセルする権限がありません' },
          { status: 403 }
        );
      }
    }

    // 招待削除
    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({
      message: '招待が正常にキャンセルされました',
    });
  } catch (error) {
    console.error('招待キャンセルエラー:', error);
    return NextResponse.json(
      { error: '招待のキャンセルに失敗しました' },
      { status: 500 }
    );
  }
} 