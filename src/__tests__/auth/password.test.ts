import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('Password Authentication Tests', () => {
  // テスト用のパスワード
  const testPassword = 'Test@Password123';
  let hashedPassword: string;

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      // パスワードをハッシュ化
      hashedPassword = await hashPassword(testPassword);
      
      // ハッシュが文字列であることを確認
      expect(typeof hashedPassword).toBe('string');
      
      // ハッシュが元のパスワードと異なることを確認
      expect(hashedPassword).not.toBe(testPassword);
      
      // bcryptのハッシュは$2a$, $2b$, $2y$で始まる
      expect(hashedPassword.startsWith('$2')).toBe(true);
      
      // ハッシュの長さが適切であることを確認
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for the same password', async () => {
      // 同じパスワードを2回ハッシュ化
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      
      // 2つのハッシュが異なることを確認（ソルトがランダムに生成されるため）
      expect(hash1).not.toBe(hash2);
    });

    it('should hash empty string properly', async () => {
      // 空文字をハッシュ化
      const emptyHash = await hashPassword('');
      
      // ハッシュが生成されることを確認
      expect(typeof emptyHash).toBe('string');
      expect(emptyHash.length).toBeGreaterThan(50);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password against hash', async () => {
      // 正しいパスワードの検証
      const isValid = await verifyPassword(testPassword, hashedPassword);
      
      // 検証が成功することを確認
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password against hash', async () => {
      // 誤ったパスワードの検証
      const wrongPassword = 'WrongPassword123';
      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      
      // 検証が失敗することを確認
      expect(isValid).toBe(false);
    });

    it('should reject case-sensitive password against hash', async () => {
      // 大文字小文字が異なるパスワードの検証
      const caseDifferentPassword = 'test@password123';
      const isValid = await verifyPassword(caseDifferentPassword, hashedPassword);
      
      // 大文字小文字が異なるため検証が失敗することを確認
      expect(isValid).toBe(false);
    });

    it('should reject empty password against valid hash', async () => {
      // 空のパスワードの検証
      const isValid = await verifyPassword('', hashedPassword);
      
      // 検証が失敗することを確認
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash format properly', async () => {
      // 無効なハッシュ形式の検証
      const invalidHash = 'invalid-hash-format';
      
      // エラーなくfalseを返すことを確認（bcryptは無効なハッシュを検出する）
      await expect(verifyPassword(testPassword, invalidHash)).resolves.toBe(false);
    });
  });
}); 