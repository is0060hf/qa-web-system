import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { z } from 'zod';
import { InvitationStatus, ProjectRole } from '@prisma/client';

// リクエストスキーマ
const respondInvitationSchema = z.object({
  token: z.string().min(1, 'トークンは必須です'),
  accept: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストのバリデーション
    const validation = await validateRequest(req, respondInvitationSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { token, accept } = validation.data;

    // 招待を取得
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        project: true,
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '招待が見つかりません' },
        { status: 404 }
      );
    }

    // 招待のステータスチェック
    if (invitation.status !== InvitationStatus.PENDING) {
      return NextResponse.json(
        { error: 'この招待は既に応答済みです' },
        { status: 410 }
      );
    }

    // 有効期限チェック
    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'この招待は期限切れです' },
        { status: 410 }
      );
    }

    // 招待メールアドレスとユーザーのメールアドレスが一致するかチェック
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: 'この招待はあなた宛てではありません' },
        { status: 403 }
      );
    }

    if (accept) {
      // 承認の場合、トランザクションで招待ステータス更新とプロジェクトメンバー追加を行う
      const result = await prisma.$transaction(async (tx) => {
        // 既にプロジェクトメンバーでないかチェック
        const existingMember = await tx.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: invitation.projectId,
              userId: user.id,
            },
          },
        });

        if (existingMember) {
          throw new Error('既にプロジェクトのメンバーです');
        }

        // 招待ステータスを更新
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.ACCEPTED },
        });

        // プロジェクトメンバーとして追加
        const membership = await tx.projectMember.create({
          data: {
            projectId: invitation.projectId,
            userId: user.id,
            role: ProjectRole.MEMBER,
          },
        });

        return { invitation, membership };
      });

      return NextResponse.json({
        message: 'プロジェクト招待を承認しました',
        project: {
          id: invitation.project.id,
          name: invitation.project.name,
          description: invitation.project.description,
        },
        membership: result.membership,
      });
    } else {
      // 拒否の場合
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.REJECTED },
      });

      return NextResponse.json({
        message: 'プロジェクト招待を拒否しました',
      });
    }
  } catch (error: any) {
    console.error('招待応答エラー:', error);
    
    if (error.message === '既にプロジェクトのメンバーです') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '招待への応答処理に失敗しました' },
      { status: 500 }
    );
  }
} 