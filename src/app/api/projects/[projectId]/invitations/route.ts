import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { inviteToProjectSchema } from '@/lib/validations/project';
import { canAccessProject, canManageProject } from '@/lib/utils/auth';
import crypto from 'crypto';
import { ProjectMember, ProjectRole } from '@prisma/client';

// プロジェクト招待一覧取得
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const projectId = params.projectId;
    
    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // プロジェクト招待一覧取得（管理者以外は招待を送信した人のみが取得可能）
    const isManager = accessCheck.project.members.some(
      (m: any) => m.role === ProjectRole.MANAGER
    );
    const isCreator = accessCheck.project.creator.id === user.id;
    const isAdmin = user.role === 'ADMIN';

    const invitations = await prisma.invitation.findMany({
      where: { 
        projectId,
        ...((!isManager && !isCreator && !isAdmin) ? { inviterId: user.id } : {})
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('プロジェクト招待一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクト招待一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// プロジェクト招待作成
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const projectId = params.projectId;
    
    // プロジェクト管理権限をチェック
    const accessCheck = await canManageProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // リクエストデータのバリデーション
    const validation = await validateRequest(req, inviteToProjectSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { email } = validation.data;

    // 既存ユーザーのチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // 既にプロジェクトメンバーか確認
    if (existingUser) {
      const isAlreadyMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: existingUser.id,
          }
        }
      });

      if (isAlreadyMember) {
        return NextResponse.json(
          { error: 'このユーザーは既にプロジェクトメンバーです' },
          { status: 409 }
        );
      }
    }

    // 既に招待しているか確認
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        projectId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に招待されています' },
        { status: 409 }
      );
    }

    // トークン生成と有効期限設定
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 招待有効期限7日間

    // 招待作成
    const invitation = await prisma.invitation.create({
      data: {
        email,
        projectId,
        inviterId: user.id,
        token,
        expiresAt,
        status: 'PENDING',
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 実際のアプリケーションでは、ここでメール送信サービスを使用して招待メールを送信

    return NextResponse.json({
      message: 'プロジェクト招待を送信しました',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        inviter: invitation.inviter,
        project: invitation.project,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('プロジェクト招待作成エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクト招待の作成に失敗しました' },
      { status: 500 }
    );
  }
} 