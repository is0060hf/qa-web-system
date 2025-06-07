import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { put, del } from '@vercel/blob';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// プロフィール画像のアップロード
export async function POST(req: NextRequest) {
  try {
    // Authorization ヘッダーからトークンを取得
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // トークンの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'ファイルが指定されていません' }, { status: 400 });
    }

    // ファイルタイプのチェック
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: '画像ファイル（JPEG, PNG, GIF, WebP）のみアップロード可能です' 
      }, { status: 400 });
    }

    // ファイルサイズのチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'ファイルサイズは5MB以下にしてください' 
      }, { status: 400 });
    }

    // 古いプロフィール画像を削除
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profileImage: true }
    });

    if (existingUser?.profileImage) {
      // Vercel Blobから削除
      try {
        await del(existingUser.profileImage.storageUrl);
      } catch (error) {
        console.error('Failed to delete old profile image from storage:', error);
      }

      // データベースから削除
      await prisma.mediaFile.delete({
        where: { id: existingUser.profileImage.id }
      });
    }

    // Vercel Blobにアップロード
    const blob = await put(`profile-images/${user.id}-${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    // データベースに保存
    const mediaFile = await prisma.mediaFile.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storageUrl: blob.url,
        uploaderId: user.id,
      }
    });

    // ユーザーのプロフィール画像を更新
    await prisma.user.update({
      where: { id: user.id },
      data: { profileImageId: mediaFile.id }
    });

    return NextResponse.json({ 
      url: mediaFile.storageUrl,
      id: mediaFile.id 
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    return NextResponse.json({ 
      error: 'プロフィール画像のアップロードに失敗しました' 
    }, { status: 500 });
  }
}

// プロフィール画像の削除
export async function DELETE(req: NextRequest) {
  try {
    // Authorization ヘッダーからトークンを取得
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // トークンの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profileImage: true }
    });

    if (!existingUser?.profileImage) {
      return NextResponse.json({ 
        error: 'プロフィール画像が設定されていません' 
      }, { status: 404 });
    }

    // Vercel Blobから削除
    try {
      await del(existingUser.profileImage.storageUrl);
    } catch (error) {
      console.error('Failed to delete profile image from storage:', error);
    }

    // データベースから削除
    await prisma.mediaFile.delete({
      where: { id: existingUser.profileImage.id }
    });

    // ユーザーのプロフィール画像をnullに更新
    await prisma.user.update({
      where: { id: user.id },
      data: { profileImageId: null }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile image delete error:', error);
    return NextResponse.json({ 
      error: 'プロフィール画像の削除に失敗しました' 
    }, { status: 500 });
  }
} 