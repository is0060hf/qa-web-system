import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/utils/api';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 現在の実装では、JWTトークンはステートレスなため、
    // サーバー側でトークンを無効化することはできません。
    // 将来的にRefreshTokenモデルを実装した際に、
    // リフレッシュトークンの無効化処理を追加します。

    // クライアント側でトークンを削除することでログアウトを実現します
    return NextResponse.json({
      message: 'ログアウトしました'
    });
  } catch (error) {
    console.error('ログアウトエラー:', error);
    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    );
  }
} 