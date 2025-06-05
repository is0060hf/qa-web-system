import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { createProjectTagSchema } from '@/lib/validations/project';
import { canAccessProject, canManageProject } from '@/lib/utils/auth';

// プロジェクトタグ一覧取得
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

    // プロジェクトタグ一覧取得
    const tags = await prisma.projectTag.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('プロジェクトタグ一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクトタグ一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// プロジェクトタグ作成
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
    const validation = await validateRequest(req, createProjectTagSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { name } = validation.data;

    // 同名タグの存在確認
    const existingTag = await prisma.projectTag.findUnique({
      where: {
        projectId_name: {
          projectId,
          name,
        },
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: '同じ名前のタグがすでに存在します' },
        { status: 409 }
      );
    }

    // タグ作成
    const tag = await prisma.projectTag.create({
      data: {
        name,
        projectId,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('プロジェクトタグ作成エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクトタグの作成に失敗しました' },
      { status: 500 }
    );
  }
} 