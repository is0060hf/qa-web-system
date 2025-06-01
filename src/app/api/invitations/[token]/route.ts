import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { InvitationStatus, ProjectRole } from '@prisma/client';

// 招待の詳細取得
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // 招待を取得
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
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

    // 有効期限チェック
    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'この招待は期限切れです' },
        { status: 410 }
      );
    }

    // 既に応答済みかチェック
    if (invitation.status !== InvitationStatus.PENDING) {
      return NextResponse.json(
        { error: 'この招待は既に応答済みです' },
        { status: 410 }
      );
    }

    // 認証済みの場合、招待メールアドレスとの一致をチェック
    const user = getUserFromRequest(req);
    if (user && user.email !== invitation.email) {
      return NextResponse.json(
        { error: 'この招待はあなた宛てではありません' },
        { status: 403 }
      );
    }

    // レスポンスの形式を整形
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        project: {
          id: invitation.project.id,
          name: invitation.project.name,
          description: invitation.project.description,
        },
        inviter: {
          id: invitation.inviter.id,
          name: invitation.inviter.name,
          email: invitation.inviter.email,
        },
      },
    });
  } catch (error) {
    console.error('招待詳細取得エラー:', error);
    return NextResponse.json(
      { error: '招待情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 招待への応答（承認/拒否）
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const user = getUserFromRequest(req);
    const token = params.token;
    const { action } = await req.json();

    // アクションのバリデーション
    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json(
        { error: '無効なアクション。"accept" または "reject" を指定してください' },
        { status: 400 }
      );
    }

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
    // 認証が必要な場合はここでチェック
    if (user && user.email !== invitation.email) {
      return NextResponse.json(
        { error: 'この招待は別のメールアドレス宛てに送信されています' },
        { status: 403 }
      );
    }

    // 招待を承認
    if (action === 'accept') {
      // ユーザーが存在するか確認
      if (!user) {
        return NextResponse.json(
          { error: '招待を承認するには、まずログインしてください' },
          { status: 401 }
        );
      }

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
    if (action === 'reject') {
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