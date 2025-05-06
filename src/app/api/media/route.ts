import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { createMediaFileSchema } from '@/lib/validations/media';
import { Role } from '@prisma/client';

// メディアファイル一覧取得
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // クエリパラメータの取得
    const { searchParams } = req.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor');
    const filterMimeType = searchParams.get('type');

    // ページネーション用のクエリ条件
    const paginationParams: any = {
      take: limit,
      where: {
        // 管理者以外は自分がアップロードしたファイルのみ取得可能
        ...(user.role !== Role.ADMIN ? { uploaderId: user.id } : {}),
        // MIMEタイプでフィルター
        ...(filterMimeType ? {
          fileType: {
            startsWith: filterMimeType
          }
        } : {})
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
    };

    // カーソルベースのページネーション
    if (cursor) {
      paginationParams.cursor = {
        id: cursor,
      };
      paginationParams.skip = 1; // カーソル自体はスキップ
    }

    // メディアファイル取得
    const files = await prisma.mediaFile.findMany(paginationParams);

    // 次のカーソル
    const nextCursor = files.length === limit ? files[files.length - 1].id : null;

    return NextResponse.json({
      files,
      nextCursor,
    });
  } catch (error) {
    console.error('メディアファイル一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'メディアファイルの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// メディアファイル情報登録
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストデータのバリデーション
    const validation = await validateRequest(req, createMediaFileSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { fileName, fileSize, fileType, storageUrl } = validation.data;

    // メディアファイル情報をデータベースに登録
    const mediaFile = await prisma.mediaFile.create({
      data: {
        fileName,
        fileSize,
        fileType,
        storageUrl,
        uploaderId: user.id,
      },
    });

    return NextResponse.json(mediaFile, { status: 201 });
  } catch (error) {
    console.error('メディアファイル情報登録エラー:', error);
    return NextResponse.json(
      { error: 'メディアファイル情報の登録に失敗しました' },
      { status: 500 }
    );
  }
} 