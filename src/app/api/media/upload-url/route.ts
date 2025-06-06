import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { getUploadUrlSchema } from '@/lib/validations/media';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { getMimeType } from '@/lib/utils/blob';

// アップロード用クライアントトークン生成
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

    // クライアントトークンを生成
    const clientToken = await generateClientTokenFromReadWriteToken({
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      pathname: filePath,
      addRandomSuffix: false, // すでにランダムサフィックスを追加済み
      maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
      allowedContentTypes: [contentType],
      validUntil: Date.now() + 60 * 60 * 1000, // 1時間有効
    });

    // Note: clientTokenを使った直接アップロードは、クライアント側で実装します
    // ここでは簡易的にトークンとURLパターンを返します
    const baseUrl = process.env.BLOB_PUBLIC_URL || 'https://blob.vercel-storage.com';

    return NextResponse.json({
      clientToken,
      uploadUrl: `${baseUrl}/upload`, // これは仮のURL
      url: `${baseUrl}/${filePath}`, // アップロード完了後のURL（予測）
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