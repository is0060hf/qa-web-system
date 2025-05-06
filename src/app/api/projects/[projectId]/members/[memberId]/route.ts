import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { updateProjectMemberRoleSchema } from '@/lib/validations/project';
import { canManageProject } from '@/lib/utils/auth';

// メンバーロール更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; memberId: string } }
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, memberId } = params;
    
    // プロジェクト管理権限をチェック
    const accessCheck = await canManageProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // リクエストデータのバリデーション
    const validation = await validateRequest(req, updateProjectMemberRoleSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { role } = validation.data;

    // メンバーの存在確認
    const existingMember = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        user: true,
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'プロジェクトメンバーが見つかりません' },
        { status: 404 }
      );
    }

    // プロジェクト作成者のロールは変更不可
    const project = accessCheck.project;
    if (existingMember.user.id === project.creatorId) {
      return NextResponse.json(
        { error: 'プロジェクト作成者のロールは変更できません' },
        { status: 403 }
      );
    }

    // ロール更新
    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
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

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('メンバーロール更新エラー:', error);
    return NextResponse.json(
      { error: 'メンバーロールの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// メンバー削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; memberId: string } }
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, memberId } = params;
    
    // プロジェクト管理権限をチェック
    const accessCheck = await canManageProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // メンバーの存在確認
    const existingMember = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        user: true,
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'プロジェクトメンバーが見つかりません' },
        { status: 404 }
      );
    }

    // プロジェクト作成者は削除不可
    const project = accessCheck.project;
    if (existingMember.user.id === project.creatorId) {
      return NextResponse.json(
        { error: 'プロジェクト作成者をプロジェクトから削除することはできません' },
        { status: 403 }
      );
    }

    // 自分自身の削除は不可（これは管理者自身による自分の削除を防ぐため）
    if (existingMember.userId === user.id) {
      return NextResponse.json(
        { error: '自分自身をプロジェクトから削除することはできません' },
        { status: 403 }
      );
    }

    // メンバー削除
    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json(
      { message: 'プロジェクトメンバーが正常に削除されました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('メンバー削除エラー:', error);
    return NextResponse.json(
      { error: 'メンバーの削除に失敗しました' },
      { status: 500 }
    );
  }
} 