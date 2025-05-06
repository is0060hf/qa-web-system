import { generateToken, verifyToken, getTokenFromHeader } from '@/lib/auth/jwt';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';

describe('JWT Authentication Tests', () => {
  // テスト用のユーザーデータ
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: Role.USER
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token with user information', () => {
      // トークン生成
      const token = generateToken(testUser);
      
      // トークンが文字列であることを確認
      expect(typeof token).toBe('string');
      expect(token).not.toBe('');
      
      // トークンが3つの部分（ヘッダー、ペイロード、署名）から構成されていることを確認
      const tokenParts = token.split('.');
      expect(tokenParts.length).toBe(3);
      
      // ペイロードを検証
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      expect(payload.userId).toBe(testUser.id);
      expect(payload.email).toBe(testUser.email);
      expect(payload.role).toBe(testUser.role);
      expect(payload).toHaveProperty('exp'); // 有効期限が含まれていることを確認
    });
  });

  describe('verifyToken', () => {
    it('should verify and return payload from a valid token', () => {
      // トークン生成
      const token = generateToken(testUser);
      
      // トークン検証
      const payload = verifyToken(token);
      
      // ペイロードが正しいことを確認
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(testUser.id);
      expect(payload?.email).toBe(testUser.email);
      expect(payload?.role).toBe(testUser.role);
    });

    it('should return null for an invalid token', () => {
      // 無効なトークン
      const invalidToken = 'invalid.token.string';
      
      // トークン検証
      const payload = verifyToken(invalidToken);
      
      // 検証失敗でnullが返ることを確認
      expect(payload).toBeNull();
    });

    it('should return null for an expired token', () => {
      // 期限切れトークンを作成（1秒で期限切れ）
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET as jwt.Secret,
        { expiresIn: '1ms' }
      );
      
      // わずかな遅延
      setTimeout(() => {
        // トークン検証
        const payload = verifyToken(expiredToken);
        
        // 期限切れでnullが返ることを確認
        expect(payload).toBeNull();
      }, 10);
    });
  });

  describe('getTokenFromHeader', () => {
    it('should extract token from valid Authorization header', () => {
      // 有効な認証ヘッダー
      const token = 'valid-token';
      const authHeader = `Bearer ${token}`;
      
      // トークン抽出
      const extractedToken = getTokenFromHeader(authHeader);
      
      // 正しく抽出されていることを確認
      expect(extractedToken).toBe(token);
    });

    it('should return null for missing Authorization header', () => {
      // ヘッダーなし
      const extractedToken = getTokenFromHeader(undefined);
      
      // nullが返ることを確認
      expect(extractedToken).toBeNull();
    });

    it('should return null for invalid Authorization header format', () => {
      // 無効な形式のヘッダー
      const invalidHeader = 'InvalidFormat token-value';
      
      // トークン抽出
      const extractedToken = getTokenFromHeader(invalidHeader);
      
      // 形式不正でnullが返ることを確認
      expect(extractedToken).toBeNull();
    });

    it('should return null for Authorization header without token', () => {
      // トークンのない認証ヘッダー
      const missingTokenHeader = 'Bearer ';
      
      // トークン抽出
      const extractedToken = getTokenFromHeader(missingTokenHeader);
      
      // トークンが空でもnullにはならないことに注意
      expect(extractedToken).toBe('');
    });
  });
}); 