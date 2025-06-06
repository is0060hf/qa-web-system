import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/utils/api';

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('Simple upload API called');
  
  try {
    // ユーザー認証
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    // トークンの確認
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      console.error('BLOB_READ_WRITE_TOKEN is not set');
      return NextResponse.json(
        { error: 'Blob storage not configured' },
        { status: 500 }
      );
    }
    
    // フォームデータからファイルを取得
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルがありません' },
        { status: 400 }
      );
    }
    
    console.log('Uploading file:', file.name, 'size:', file.size);
    
    // Vercel Blobにアップロード
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
      token: blobToken,
    });
    
    console.log('Upload successful:', blob);
    
    return NextResponse.json({
      success: true,
      blob: blob,
      userId: user.id,
    });
  } catch (error) {
    console.error('Simple upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
} 