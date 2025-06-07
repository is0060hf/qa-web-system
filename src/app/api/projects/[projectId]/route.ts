import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { updateProjectSchema } from '@/lib/validations/project';
import { canAccessProject, canManageProject } from '@/lib/utils/auth';

// プロジェクト詳細取得
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

    const { project } = accessCheck;

    // タグ情報を追加取得
    const tags = await prisma.projectTag.findMany({
      where: { projectId },
    });

    // プロジェクトメンバー情報を加工
    const formattedMembers = project.members.map((member: any) => ({
      id: member.id,
      userId: member.userId,
      userName: member.user.name || null,
      userEmail: member.user.email,
      role: member.role,
      joinedAt: member.createdAt,
      profileImage: member.user.profileImage ? {
        id: member.user.profileImage.id,
        storageUrl: member.user.profileImage.storageUrl
      } : null
    }));

    // プロジェクトの質問情報も取得
    const questions = await prisma.question.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        status: true,
        creatorId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      ...project,
      members: formattedMembers,
      questions,
      tags,
    });
  } catch (error) {
    console.error('プロジェクト詳細取得エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクト詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// プロジェクト更新
export async function PATCH(
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
    const validation = await validateRequest(req, updateProjectSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { name, description } = validation.data;

    // プロジェクト更新
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('プロジェクト更新エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクトの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// プロジェクト削除
export async function DELETE(
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

    // プロジェクト削除 (関連するデータはスキーマのonDeleteカスケードで削除される)
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json(
      { message: 'プロジェクトが正常に削除されました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('プロジェクト削除エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクトの削除に失敗しました' },
      { status: 500 }
    );
  }
} 