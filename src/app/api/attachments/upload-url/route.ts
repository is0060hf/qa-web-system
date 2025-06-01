import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { z } from 'zod';
import { put } from '@vercel/blob';
import crypto from 'crypto';

// リクエストスキーマ
const uploadUrlSchema = z.object({
  fileName: z.string().min(1, 'ファイル名は必須です'),
  contentType: z.string().min(1, 'コンテンツタイプは必須です'),
  answerId: z.string().optional(), // 一時的または実際の回答ID
});

// ファイルサイズ制限（1GB）
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB in bytes

// 許可されるファイルタイプ
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

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

    // ファイルタイプの検証
    if (!ALLOWED_FILE_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: '許可されていないファイルタイプです' },
        { status: 400 }
      );
    }

    // ユニークなファイル名を生成（衝突を避けるため）
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${user.id}/${timestamp}-${randomString}-${sanitizedFileName}`;

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
        maxSize: MAX_FILE_SIZE,
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
      { error: 'アップロードURLの生成に失敗しました' },
      { status: 500 }
    );
  }
} 