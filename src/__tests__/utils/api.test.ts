import { getUserFromRequest, validateRequest } from '@/lib/utils/api';
import { createMockRequest } from '../utils/test-helpers';
import { z } from 'zod';
import { NextResponse } from 'next/server';

describe('API Utilities Tests', () => {
  describe('getUserFromRequest', () => {
    it('should extract user information from request headers', () => {
      // テスト用ユーザー情報
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const role = 'USER';
      
      // ヘッダー付きのモックリクエスト
      const req = createMockRequest('GET', 'https://example.com', {
        'x-user-id': userId,
        'x-user-email': email,
        'x-user-role': role,
      });
      
      // ユーザー情報の取得
      const user = getUserFromRequest(req);
      
      // 正しいユーザー情報が抽出されていることを確認
      expect(user).not.toBeNull();
      expect(user?.id).toBe(userId);
      expect(user?.email).toBe(email);
      expect(user?.role).toBe(role);
    });

    it('should return null when user headers are missing', () => {
      // ユーザーヘッダーのないリクエスト
      const req = createMockRequest('GET', 'https://example.com');
      
      // ユーザー情報の取得
      const user = getUserFromRequest(req);
      
      // nullが返されることを確認
      expect(user).toBeNull();
    });

    it('should return null when some user headers are missing', () => {
      // 一部のヘッダーが不足したリクエスト
      const req = createMockRequest('GET', 'https://example.com', {
        'x-user-id': 'test-user-id',
        'x-user-email': 'test@example.com',
        // 'x-user-role'が不足
      });
      
      // ユーザー情報の取得
      const user = getUserFromRequest(req);
      
      // ヘッダーが不完全なためnullが返されることを確認
      expect(user).toBeNull();
    });
  });

  describe('validateRequest', () => {
    // テスト用のバリデーションスキーマ
    const testSchema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
      age: z.number().int().positive().optional(),
    });

    it('should validate valid request data', async () => {
      // 有効なリクエストデータ
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };
      
      // モックリクエスト
      const req = createMockRequest('POST', 'https://example.com', {}, validData);
      
      // リクエストの検証
      const result = await validateRequest(req, testSchema);
      
      // 検証成功を確認
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid request data', async () => {
      // 無効なリクエストデータ
      const invalidData = {
        name: 'Jo', // 3文字未満
        email: 'not-an-email', // 無効なメール形式
        age: -5 // 負数
      };
      
      // モックリクエスト
      const req = createMockRequest('POST', 'https://example.com', {}, invalidData);
      
      // NextResponse.jsonをモック
      const jsonSpy = jest.spyOn(NextResponse, 'json');
      
      // リクエストの検証
      const result = await validateRequest(req, testSchema);
      
      // 検証失敗を確認
      expect(result.success).toBe(false);
      expect(jsonSpy).toHaveBeenCalled();
      
      // エラーレスポンスを確認
      const jsonCall = jsonSpy.mock.calls[0];
      expect(jsonCall[0]).toHaveProperty('error');
      expect(jsonCall[1]).toHaveProperty('status', 400);
      
      jsonSpy.mockRestore();
    });

    it('should handle JSON parsing errors', async () => {
      // モックリクエスト（JSON解析エラー）
      const req = createMockRequest('POST', 'https://example.com');
      // @ts-ignore: テスト用にJSONメソッドを上書き
      req.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));
      
      // NextResponse.jsonをモック
      const jsonSpy = jest.spyOn(NextResponse, 'json');
      
      // リクエストの検証
      const result = await validateRequest(req, testSchema);
      
      // 検証失敗を確認
      expect(result.success).toBe(false);
      expect(jsonSpy).toHaveBeenCalled();
      
      // エラーレスポンスを確認
      const jsonCall = jsonSpy.mock.calls[0];
      expect(jsonCall[0]).toHaveProperty('error');
      expect(jsonCall[1]).toHaveProperty('status', 400);
      
      jsonSpy.mockRestore();
    });
  });
}); 