import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { getUploadUrlSchema } from '@/lib/validations/media';
import { put } from '@vercel/blob';
import { getMimeType } from '@/lib/utils/blob';

// 署名付きURL生成結果の型定義
interface PresignedUrlResult {
  url: string;
  uploadUrl: string;
}

// 拡張されたPutオプション
interface ExtendedPutOptions {
  access: 'public';
  handleUploadUrl: boolean;
  contentType: string;
  multipart: boolean;
  token?: string;
}

// アップロード用署名付きURL生成
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストデータのバリデーション
    const validation = await validateRequest(req, getUploadUrlSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { fileName, contentType, directory } = validation.data;

    // ファイルのMIMEタイプの確認（セキュリティ対策）
    const expectedMimeType = getMimeType(fileName);
    if (expectedMimeType !== contentType && contentType !== 'application/octet-stream') {
      return NextResponse.json(
        { error: '無効なコンテンツタイプです' },
        { status: 400 }
      );
    }

    // ユニークなファイル名を生成
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const uniqueFileName = `${timestamp}-${randomSuffix}-${fileName}`;
    
    // ディレクトリを指定して最終的なパスを構築
    const filePath = directory 
      ? `${directory}/${user.id}/${uniqueFileName}`
      : `uploads/${user.id}/${uniqueFileName}`;

    // Vercel Blobへのアップロード用署名付きURLを生成
    // @ts-ignore - 型の互換性エラーを無視
    const result = await put(filePath, '', {
      access: 'public',
      handleUploadUrl: true,
      contentType,
      multipart: true,
      token: process.env.BLOB_READ_WRITE_TOKEN
    } as ExtendedPutOptions) as PresignedUrlResult;

    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      url: result.url,
      fileName,
      fileType: contentType,
    });
  } catch (error) {
    console.error('アップロードURL生成エラー:', error);
    return NextResponse.json(
      { error: 'アップロードURLの生成に失敗しました' },
      { status: 500 }
    );
  }
} 