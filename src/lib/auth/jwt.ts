import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
// リフレッシュトークン用の別シークレット
// ビルド時やテスト時はデフォルト値を使用、本番実行時は環境変数を必須とする
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-key';

// 実行時に本番環境で環境変数がない場合の警告（ビルド時は除く）
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.JWT_REFRESH_SECRET && !process.env.NEXT_PHASE) {
  console.error('[JWT] WARNING: JWT_REFRESH_SECRET is not set in production. Using default value is a security risk!');
}
// アクセストークンは30分、リフレッシュトークンは7日
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '1800'; // 30分
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '604800'; // 7日

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenType?: 'access' | 'refresh';
}

export function generateToken(user: Pick<User, 'id' | 'email' | 'role'>, tokenType: 'access' | 'refresh' = 'access'): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tokenType
  };

  const expiryInSeconds = parseInt(
    tokenType === 'access' ? JWT_ACCESS_EXPIRY : JWT_REFRESH_EXPIRY, 
    10
  );
  const now = Math.floor(Date.now() / 1000);
  const expiryTime = now + expiryInSeconds;
  
  console.log(`[JWT] 現在時刻 (unix): ${now}`);
  console.log(`[JWT] ${tokenType}トークン有効期限 (unix): ${expiryTime}`);
  console.log(`[JWT] 有効期間: ${expiryInSeconds} 秒`);
  console.log(`[JWT] 有効期限: ${new Date(expiryTime * 1000).toISOString()}`);
  console.log(`[JWT] Generating ${tokenType} token with expiry: ${expiryInSeconds} seconds`);

  const secret = tokenType === 'refresh' ? refreshSecret : JWT_SECRET;
  return jwt.sign(payload, secret as jwt.Secret, { expiresIn: expiryInSeconds });
}

export function generateTokenPair(user: Pick<User, 'id' | 'email' | 'role'>) {
  return {
    accessToken: generateToken(user, 'access'),
    refreshToken: generateToken(user, 'refresh')
  };
}

export function verifyToken(token: string, tokenType?: 'access' | 'refresh'): JwtPayload | null {
  try {
    const secret = tokenType === 'refresh' ? refreshSecret : JWT_SECRET;
    console.log(`[JWT] Verifying ${tokenType || 'unknown'} token`);
    
    // トークンの内容を検証前に確認
    const decoded = jwt.decode(token);
    console.log(`[JWT] Decoded token payload:`, decoded);
    
    // 現在時刻との比較
    if (decoded && typeof decoded === 'object' && decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      console.log(`[JWT] Current time (unix): ${now}`);
      console.log(`[JWT] Token expires at (unix): ${decoded.exp}`);
      console.log(`[JWT] Token expires in: ${decoded.exp - now} seconds`);
      
      if (decoded.exp <= now) {
        console.log(`[JWT] Token already expired by ${now - decoded.exp} seconds`);
      }
    }
    
    const payload = jwt.verify(token, secret as jwt.Secret) as JwtPayload;
    
    // トークンタイプの検証
    if (tokenType && payload.tokenType !== tokenType) {
      console.error(`[JWT] Token type mismatch. Expected: ${tokenType}, Got: ${payload.tokenType}`);
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('[JWT] Token verification failed:', error);
    return null;
  }
}

export function getTokenFromHeader(authorization?: string): string | null {
  if (!authorization) return null;
  
  const parts = authorization.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
} 