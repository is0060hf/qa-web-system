import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '900';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const expiryInSeconds = parseInt(JWT_ACCESS_EXPIRY, 10);
  const now = Math.floor(Date.now() / 1000);
  const expiryTime = now + expiryInSeconds;
  
  console.log(`[JWT] 現在時刻 (unix): ${now}`);
  console.log(`[JWT] トークン有効期限 (unix): ${expiryTime}`);
  console.log(`[JWT] 有効期間: ${expiryInSeconds} 秒`);
  console.log(`[JWT] 有効期限: ${new Date(expiryTime * 1000).toISOString()}`);
  console.log(`[JWT] Generating token with expiry: ${expiryInSeconds} seconds`);

  return jwt.sign(payload, JWT_SECRET as jwt.Secret, { expiresIn: expiryInSeconds });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    console.log(`[JWT] Verifying token with secret: ${JWT_SECRET.substring(0, 10)}...`);
    
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
    
    return jwt.verify(token, JWT_SECRET as jwt.Secret) as JwtPayload;
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