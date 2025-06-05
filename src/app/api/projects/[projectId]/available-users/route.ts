import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { canAccessProject, canManageProject } from '@/lib/utils/auth';

/**
 * プロジェクトに参加していないユーザー一覧を取得（自分自身を除く）
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // ログインユーザーの取得
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    console.log('ログインユーザー:', user.id, user.email);
    
    const { projectId } = await params;
    
    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }
    
    // プロジェクトの管理権限をチェック - プロジェクトメンバーなら招待可能
    // (管理権限のチェックは仕様に応じて変更可)
    
    // 現在のプロジェクトメンバーのユーザーIDを取得
    const currentMemberIds = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true }
    });
    
    const memberUserIds = currentMemberIds.map(member => member.userId);
    console.log('現在のプロジェクトメンバーIDs:', memberUserIds);
    
    // 除外すべきユーザーID群（現在のメンバー + 自分自身）
    const excludeUserIds = [...memberUserIds, user.id];
    console.log('除外するユーザーIDs:', excludeUserIds);
    
    // 参加していないユーザーを取得（自分自身を除外）
    const availableUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: excludeUserIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log('取得した招待可能ユーザー数:', availableUsers.length);
    
    return NextResponse.json(availableUsers);
  } catch (error) {
    console.error('利用可能なユーザー一覧取得エラー:', error);
    return NextResponse.json(
      { error: '利用可能なユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
} 