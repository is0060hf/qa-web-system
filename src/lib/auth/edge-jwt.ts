import { jwtVerify, SignJWT, decodeJwt } from 'jose';
import { JwtPayload } from './jwt';

// 秘密鍵をUint8Arrayに変換するヘルパー関数
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'default-secret-key';
  return new TextEncoder().encode(secret);
}

/**
 * Edge Runtimeで動作するJWT検証関数
 */
export async function verifyTokenEdge(token: string): Promise<JwtPayload | null> {
  try {
    console.log(`[EdgeJWT] Verifying token...`);
    
    // デコードしてペイロードを確認（検証はまだ行わない）
    const decodedToken = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);
    console.log(`[EdgeJWT] Token payload:`, decodedToken);
    console.log(`[EdgeJWT] Current time (unix): ${now}`);
    
    if (decodedToken.exp) {
      console.log(`[EdgeJWT] Token expires at (unix): ${decodedToken.exp}`);
      console.log(`[EdgeJWT] Token expires in: ${decodedToken.exp - now} seconds`);
      
      if (decodedToken.exp <= now) {
        console.log(`[EdgeJWT] Token already expired by ${now - decodedToken.exp} seconds`);
      }
    }
    
    if (decodedToken.iat) {
      console.log(`[EdgeJWT] Token issued at (unix): ${decodedToken.iat}`);
      console.log(`[EdgeJWT] Token age: ${now - decodedToken.iat} seconds`);
    }
    
    const secretKey = getSecretKey();
    
    // 実際の検証
    const { payload } = await jwtVerify(token, secretKey);
    
    // ペイロードの型をJwtPayloadに変換
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string
    };
  } catch (error) {
    console.error('[EdgeJWT] Token verification failed:', error);
    
    // エラーに応じた詳細ログ
    if (error instanceof Error) {
      if (error.name === 'JWTExpired') {
        console.log('[EdgeJWT] トークンの有効期限が切れています。再ログインが必要です。');
      } else if (error.name === 'JWSSignatureVerificationFailed') {
        console.log('[EdgeJWT] トークンの署名検証に失敗しました。シークレットキーが異なる可能性があります。');
      }
    }
    
    return null;
  }
}

/**
 * JWTトークンをヘッダーから抽出する関数
 * (元の関数と同じ内容を共有)
 */
export function getTokenFromHeaderEdge(authorization?: string): string | null {
  if (!authorization) return null;
  
  const parts = authorization.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
} 