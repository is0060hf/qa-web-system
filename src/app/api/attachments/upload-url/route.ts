import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { z } from 'zod';
import { put } from '@vercel/blob';
import crypto from 'crypto';
import { validateFile, sanitizeFileName, getFileSizeLimit, ALL_ALLOWED_FILE_TYPES } from '@/lib/utils/fileValidation';

// リクエストスキーマ
const uploadUrlSchema = z.object({
  fileName: z.string().min(1, 'ファイル名は必須です'),
  contentType: z.string().min(1, 'コンテンツタイプは必須です'),
  answerId: z.string().optional(), // 一時的または実際の回答ID
});

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストのバリデーション
    const validation = await validateRequest(req, uploadUrlSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { fileName, contentType, answerId } = validation.data;

    // ファイルバリデーション
    const fileValidation = await validateFile(
      { name: fileName, type: contentType, size: 0 },
      { checkContent: false, skipSizeCheck: true } // URL生成時は内容とサイズチェックをスキップ
    );

    if (!fileValidation.isValid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    // ユニークなファイル名を生成（衝突を避けるため）
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedFileName = fileValidation.sanitizedFileName || sanitizeFileName(fileName);
    const uniqueFileName = `${user.id}/${timestamp}-${randomString}-${sanitizedFileName}`;

    // ファイルサイズ制限を取得
    const maxSize = getFileSizeLimit(contentType);

    // Vercel Blobへのアップロード用署名付きURLを生成
    // 注: 実際の実装では、Vercel Blobの署名付きURL生成方法に従います
    // ここでは、直接アップロードする簡易的な実装を示します
    
    try {
      // クライアントサイドでのアップロードURLを生成
      // 実際のプロダクション環境では、よりセキュアな方法を検討してください
      const uploadUrl = `/api/media/upload`;
      
      // アップロード完了後の最終的なBlobのURLを予測
      const blobUrl = `${process.env.NEXT_PUBLIC_VERCEL_BLOB_URL || ''}/${uniqueFileName}`;

      return NextResponse.json({
        uploadUrl,
        blobUrl,
        fileName: uniqueFileName,
        maxSize,
        allowedTypes: ALL_ALLOWED_FILE_TYPES,
        // クライアントがアップロード時に使用するための一時トークン
        uploadToken: crypto.randomBytes(32).toString('hex'),
      });
    } catch (error) {
      console.error('Blob URL生成エラー:', error);
      return NextResponse.json(
        { error: 'アップロードURLの生成に失敗しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('アップロードURL生成エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
} 