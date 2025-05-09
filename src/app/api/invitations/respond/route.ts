import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { InvitationStatus, ProjectRole } from '@prisma/client';
import { z } from 'zod';
import { validateRequest } from '@/lib/utils/api';

// 招待応答スキーマ
const invitationResponseSchema = z.object({
  token: z.string().min(1, 'トークンは必須です'),
  accept: z.boolean()
});

// 招待承認/拒否
export async function POST(
  req: NextRequest
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストデータのバリデーション
    const validation = await validateRequest(req, invitationResponseSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { token, accept } = validation.data;

    // トークンの存在確認
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        project: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '招待が見つかりません' },
        { status: 404 }
      );
    }

    // 招待の有効期限切れチェック
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: '招待の有効期限が切れています' },
        { status: 410 }
      );
    }

    // 既に応答済みの招待かチェック
    if (invitation.status !== InvitationStatus.PENDING) {
      return NextResponse.json(
        { error: 'この招待は既に応答済みです' },
        { status: 410 }
      );
    }

    // 招待のメールアドレスと現在のユーザーのメールアドレスが一致するか確認
    if (user.email !== invitation.email) {
      return NextResponse.json(
        { error: 'この招待は別のメールアドレス宛てに送信されています' },
        { status: 403 }
      );
    }

    // 招待を承認
    if (accept) {
      // すでにプロジェクトメンバーか確認
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: invitation.projectId,
            userId: user.id,
          },
        },
      });

      if (existingMember) {
        // 招待を承認済みにする
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.ACCEPTED },
        });

        return NextResponse.json(
          { message: 'あなたは既にこのプロジェクトのメンバーです' },
          { status: 200 }
        );
      }

      // トランザクションでメンバー追加と招待ステータス更新を実行
      const result = await prisma.$transaction([
        // プロジェクトメンバーとして追加
        prisma.projectMember.create({
          data: {
            projectId: invitation.projectId,
            userId: user.id,
            role: ProjectRole.MEMBER, // デフォルトはメンバー
          },
        }),
        // 招待ステータスを承認済みに更新
        prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.ACCEPTED },
        }),
      ]);

      return NextResponse.json({
        message: 'プロジェクト招待を承認しました',
        project: invitation.project,
        membership: result[0],
      });
    }

    // 招待を拒否
    if (!accept) {
      // 招待ステータスを拒否に更新
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.REJECTED },
      });

      return NextResponse.json({
        message: 'プロジェクト招待を拒否しました',
      });
    }
  } catch (error) {
    console.error('招待応答エラー:', error);
    return NextResponse.json(
      { error: '招待への応答に失敗しました' },
      { status: 500 }
    );
  }
} 