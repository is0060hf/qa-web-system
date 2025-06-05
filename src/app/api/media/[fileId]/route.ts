import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { deleteFile } from '@/lib/utils/blob';
import { Role } from '@prisma/client';

// メディアファイル取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { fileId } = await params;

    // メディアファイルの存在確認
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!mediaFile) {
      return NextResponse.json(
        { error: 'メディアファイルが見つかりません' },
        { status: 404 }
      );
    }

    // アクセス権のチェック (ファイルのアップロード者または管理者のみアクセス可能)
    if (mediaFile.uploaderId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'このファイルへのアクセス権限がありません' },
        { status: 403 }
      );
    }

    return NextResponse.json(mediaFile);
  } catch (error) {
    console.error('メディアファイル取得エラー:', error);
    return NextResponse.json(
      { error: 'メディアファイルの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// メディアファイル削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { fileId } = await params;

    // メディアファイルの存在確認
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: fileId },
      include: {
        // 参照関係を確認
        answers: true,
        formData: true,
      },
    });

    if (!mediaFile) {
      return NextResponse.json(
        { error: 'メディアファイルが見つかりません' },
        { status: 404 }
      );
    }

    // アクセス権のチェック (ファイルのアップロード者または管理者のみ削除可能)
    if (mediaFile.uploaderId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'このファイルを削除する権限がありません' },
        { status: 403 }
      );
    }

    // 参照されているファイルは削除できない
    if (mediaFile.answers.length > 0 || mediaFile.formData.length > 0) {
      return NextResponse.json(
        { error: 'このファイルは回答で使用されているため削除できません' },
        { status: 409 }
      );
    }

    // トランザクションでファイルをデータベースから削除し、Vercel Blobからも削除
    const result = await prisma.$transaction(async (tx) => {
      // データベースからファイル情報を削除
      await tx.mediaFile.delete({
        where: { id: fileId },
      });

      // Vercel Blobからファイルを削除
      const blobDeleteSuccess = await deleteFile(mediaFile.storageUrl);

      return { dbDeleted: true, blobDeleted: blobDeleteSuccess };
    });

    return NextResponse.json({
      message: 'ファイルが正常に削除されました',
      result,
    });
  } catch (error) {
    console.error('メディアファイル削除エラー:', error);
    return NextResponse.json(
      { error: 'メディアファイルの削除に失敗しました' },
      { status: 500 }
    );
  }
} 