import { NextRequest, NextResponse } from 'next/server';
import { POST as createProject } from '@/app/api/projects/route';
import prisma from '@/lib/db';
import { Role } from '@prisma/client';

// NextResponse.jsonをモック
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((body, init) => ({
        body,
        status: init?.status || 200,
      })),
    },
  };
});

describe('Projects API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects (Create Project)', () => {
    it('should create a new project with valid data', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // モック新規プロジェクト
      const newProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        description: 'テストプロジェクトの説明',
        creatorId: mockUser.id,
        creator: {
          id: mockUser.id,
          name: 'テストユーザー',
          email: mockUser.email,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // モック設定
      (prisma.project.create as jest.Mock).mockResolvedValue(newProject);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        name: 'テストプロジェクト',
        description: 'テストプロジェクトの説明',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProject(req);

      // プロジェクト作成が行われたことを確認
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: reqBody.name,
          description: reqBody.description,
          creatorId: mockUser.id,
        },
        include: expect.objectContaining({
          creator: expect.any(Object),
        }),
      });

      // レスポンス検証
      expect(response.status).toBe(201);
      expect(response.body).toEqual(newProject);
    });

    it('should create a project without description', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // モック新規プロジェクト（説明なし）
      const newProject = {
        id: 'project-123',
        name: '説明なしプロジェクト',
        description: null,
        creatorId: mockUser.id,
        creator: {
          id: mockUser.id,
          name: 'テストユーザー',
          email: mockUser.email,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // モック設定
      (prisma.project.create as jest.Mock).mockResolvedValue(newProject);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });
      
      // リクエストボディをモック（説明なし）
      const reqBody = {
        name: '説明なしプロジェクト',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProject(req);

      // 成功レスポンス検証
      expect(response.status).toBe(201);
    });

    it('should reject project creation without authentication', async () => {
      // 認証情報なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 認証ヘッダーなし
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        name: 'テストプロジェクト',
        description: 'テストプロジェクトの説明',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProject(req);

      // プロジェクト作成が行われていないことを確認
      expect(prisma.project.create).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject project creation with invalid data', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });
      
      // 名前がないリクエストボディ
      const reqBody = {
        description: '名前のないプロジェクト',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProject(req);

      // プロジェクト作成が行われていないことを確認
      expect(prisma.project.create).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors during project creation', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // DBエラーをモック
      (prisma.project.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        name: 'テストプロジェクト',
        description: 'テストプロジェクトの説明',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProject(req);

      // エラーログが出力されたことを確認
      expect(consoleSpy).toHaveBeenCalled();

      // サーバーエラーレスポンス検証
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');

      // スパイをリセット
      consoleSpy.mockRestore();
    });
  });
}); 