import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { addProjectMemberSchema } from '@/lib/validations/project';
import { canAccessProject, canManageProject } from '@/lib/utils/auth';

// プロジェクトメンバー一覧取得
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

    // プロジェクトメンバー一覧取得
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('プロジェクトメンバー一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクトメンバー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// プロジェクトメンバー追加
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
    const validation = await validateRequest(req, addProjectMemberSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { userId, role } = validation.data;

    // 追加するユーザーの存在確認
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: '指定されたユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // すでにプロジェクトメンバーか確認
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'このユーザーはすでにプロジェクトメンバーです' },
        { status: 409 }
      );
    }

    // プロジェクトメンバー追加
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
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
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('プロジェクトメンバー追加エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクトメンバーの追加に失敗しました' },
      { status: 500 }
    );
  }
} 