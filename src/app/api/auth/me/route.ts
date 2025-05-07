import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
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
    
    // ユーザー情報の取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    
    // ユーザー情報を返す
    return NextResponse.json(user);
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
  }
} 