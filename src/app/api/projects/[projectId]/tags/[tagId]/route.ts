import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { canManageProject } from '@/lib/utils/auth';

// プロジェクトタグ削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; tagId: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, tagId } = await params;
    
    // プロジェクト管理権限をチェック
    const accessCheck = await canManageProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // タグの存在確認
    const tag = await prisma.projectTag.findUnique({
      where: { id: tagId },
      include: {
        questions: true, // タグに関連する質問を取得
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'タグが見つかりません' },
        { status: 404 }
      );
    }

    // タグが正しいプロジェクトに属しているか確認
    if (tag.projectId !== projectId) {
      return NextResponse.json(
        { error: 'このプロジェクトに属するタグではありません' },
        { status: 403 }
      );
    }

    // タグを使用している質問の数を確認
    if (tag.questions.length > 0) {
      // タグを使用している質問がある場合、警告メッセージを返す
      // クライアント側でこの警告に対して確認を求めることができる
      return NextResponse.json(
        {
          message: 'このタグは現在使用されています',
          usingQuestions: tag.questions.length,
          needsConfirmation: true,
        },
        { status: 409 }
      );
    }

    // タグ削除
    await prisma.projectTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json(
      { message: 'タグが正常に削除されました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('プロジェクトタグ削除エラー:', error);
    return NextResponse.json(
      { error: 'タグの削除に失敗しました' },
      { status: 500 }
    );
  }
}

// 関連質問も含めてタグを強制削除するAPI
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; tagId: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, tagId } = await params;
    
    // プロジェクト管理権限をチェック
    const accessCheck = await canManageProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // タグの存在確認
    const tag = await prisma.projectTag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'タグが見つかりません' },
        { status: 404 }
      );
    }

    // タグが正しいプロジェクトに属しているか確認
    if (tag.projectId !== projectId) {
      return NextResponse.json(
        { error: 'このプロジェクトに属するタグではありません' },
        { status: 403 }
      );
    }

    // QuestionTagの関連付けを全て削除
    await prisma.questionTag.deleteMany({
      where: { tagId },
    });

    // タグ削除
    await prisma.projectTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json(
      { message: 'タグとその関連付けが正常に削除されました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('プロジェクトタグ強制削除エラー:', error);
    return NextResponse.json(
      { error: 'タグの削除に失敗しました' },
      { status: 500 }
    );
  }
} 