import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

/**
 * リクエストヘッダーからユーザー情報を取得
 */
export function getUserFromRequest(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const email = req.headers.get('x-user-email');
  const role = req.headers.get('x-user-role');

  if (!userId || !email || !role) {
    return null;
  }

  return {
    id: userId,
    email,
    role,
  };
}

/**
 * ユーザーが管理者かどうかを確認
 */
export function isAdmin(user: { role: string } | null) {
  return user?.role === 'ADMIN';
}

/**
 * リクエストから管理者権限を確認
 */
export function isAdminRequest(req: NextRequest) {
  const user = getUserFromRequest(req);
  return isAdmin(user);
}

/**
 * リクエストボディをZodスキーマでバリデーション
 */
export async function validateRequest<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'バリデーションエラー', details: error.errors },
          { status: 400 }
        ),
      };
    }
    
    return {
      success: false,
      error: NextResponse.json(
        { error: 'リクエスト処理中にエラーが発生しました' },
        { status: 500 }
      ),
    };
  }
} 