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
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId } = await params;
    
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
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId } = await params;
    
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

    const { type } = validation.data;
    
    // 招待タイプに応じた処理
    if (type === 'email') {
      // メールアドレスによる招待
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
    } else {
      // 既存ユーザーIDによる招待
      const { userId } = validation.data;
      
      // ユーザーの存在チェック
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true }
      });
      
      if (!targetUser) {
        return NextResponse.json(
          { error: '指定されたユーザーが見つかりません' },
          { status: 404 }
        );
      }
      
      // 既にプロジェクトメンバーか確認
      const isAlreadyMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: targetUser.id,
          }
        }
      });

      if (isAlreadyMember) {
        return NextResponse.json(
          { error: 'このユーザーは既にプロジェクトメンバーです' },
          { status: 409 }
        );
      }
      
      // 既に招待しているか確認
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          email: targetUser.email,
          projectId,
          status: 'PENDING',
        },
      });

      if (existingInvitation) {
        return NextResponse.json(
          { error: 'このユーザーは既に招待されています' },
          { status: 409 }
        );
      }
      
      // 既存ユーザーの場合は、招待レコードを作成して自動的に承認し、プロジェクトメンバーに追加する
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 招待有効期限7日間

      // トランザクションを使用して、招待作成とメンバー追加を一括処理
      const [invitation, memberRecord] = await prisma.$transaction([
        // 招待レコード作成（自動承認状態）
        prisma.invitation.create({
          data: {
            email: targetUser.email,
            projectId,
            inviterId: user.id,
            token,
            expiresAt,
            status: 'ACCEPTED', // 自動承認済み
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
        }),
        
        // プロジェクトメンバーとして追加
        prisma.projectMember.create({
          data: {
            projectId,
            userId: targetUser.id,
            role: 'MEMBER', // デフォルトはメンバー権限
          },
        }),
      ]);

      // 追加処理成功を知らせる通知などの実装をここに追加することも可能
      
      return NextResponse.json({
        message: 'ユーザーをプロジェクトに追加しました',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
          inviter: invitation.inviter,
          project: invitation.project,
        },
        memberRecord: {
          id: memberRecord.id,
          userId: memberRecord.userId,
          projectId: memberRecord.projectId,
          role: memberRecord.role,
        }
      }, { status: 201 });
    }
  } catch (error) {
    console.error('プロジェクト招待作成エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクト招待の作成に失敗しました' },
      { status: 500 }
    );
  }
} 