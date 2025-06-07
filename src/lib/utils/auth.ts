import { NextResponse } from 'next/server';
import { Role, ProjectRole } from '@prisma/client';
import { prisma } from '@/lib/db';

interface User {
  id: string;
  email: string;
  role: string;
}

/**
 * ユーザーが特定のプロジェクトにアクセスできるか確認します
 * @returns 成功した場合プロジェクトとユーザーのメンバーシップ情報を返し、失敗した場合NextResponseエラーを返します
 */
export async function canAccessProject(
  projectId: string,
  user: User
): Promise<
  | { success: true; project: any; membership: any | null }
  | { success: false; error: NextResponse }
> {
  try {
    // プロジェクトの存在確認
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: {
                  select: {
                    id: true,
                    storageUrl: true,
                  },
                },
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'プロジェクトが見つかりません' },
          { status: 404 }
        ),
      };
    }

    // Adminユーザーは常にアクセス可能
    if (user.role === Role.ADMIN) {
      return { success: true, project, membership: null };
    }

    // プロジェクト作成者の場合
    if (project.creatorId === user.id) {
      return { success: true, project, membership: null };
    }

    // プロジェクトメンバーの場合
    const membership = project.members.find(
      (member) => member.userId === user.id
    );

    if (!membership) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'このプロジェクトにアクセスする権限がありません' },
          { status: 403 }
        ),
      };
    }

    return { success: true, project, membership };
  } catch (error) {
    console.error('プロジェクトアクセス権限チェックエラー:', error);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'アクセス権限の確認中にエラーが発生しました' },
        { status: 500 }
      ),
    };
  }
}

/**
 * ユーザーが特定のプロジェクトを管理する権限があるか確認します
 */
export async function canManageProject(
  projectId: string,
  user: User
): Promise<
  | { success: true; project: any }
  | { success: false; error: NextResponse }
> {
  const result = await canAccessProject(projectId, user);

  if (!result.success) {
    return result;
  }

  // Adminユーザーは常に管理可能
  if (user.role === Role.ADMIN) {
    return { success: true, project: result.project };
  }

  // プロジェクト作成者の場合
  if (result.project.creatorId === user.id) {
    return { success: true, project: result.project };
  }

  // プロジェクト管理者の場合
  if (
    result.membership &&
    result.membership.role === ProjectRole.MANAGER
  ) {
    return { success: true, project: result.project };
  }

  // それ以外は権限なし
  return {
    success: false,
    error: NextResponse.json(
      { error: 'このプロジェクトを管理する権限がありません' },
      { status: 403 }
    ),
  };
} 