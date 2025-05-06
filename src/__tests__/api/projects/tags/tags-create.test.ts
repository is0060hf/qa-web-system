import { NextRequest, NextResponse } from 'next/server';
import { POST as createProjectTag } from '@/app/api/projects/[projectId]/tags/route';
import prisma from '@/lib/db';
import { Role, ProjectRole } from '@prisma/client';
import * as authUtils from '@/lib/utils/auth';

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

// 認証ユーティリティをモック
jest.mock('@/lib/utils/auth', () => ({
  canManageProject: jest.fn(),
}));

describe('Project Tags API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects/{projectId}/tags (Create Tag)', () => {
    it('should create a new tag with valid data', async () => {
      // モックユーザー（プロジェクト管理者）
      const mockManager = {
        id: 'user-123',
        email: 'manager@example.com',
        role: Role.USER,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: 'creator-user',
      };

      // 新規タグ
      const newTag = {
        id: 'tag-123',
        name: '新機能',
        projectId: 'project-123',
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.projectTag.findUnique as jest.Mock).mockResolvedValue(null); // タグがまだ存在しない
      (prisma.projectTag.create as jest.Mock).mockResolvedValue(newTag);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        name: '新機能',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProjectTag(req, {
        params: { projectId: 'project-123' },
      });

      // 管理権限チェックが行われたことを確認
      expect(authUtils.canManageProject).toHaveBeenCalledWith('project-123', mockManager);

      // 同名タグの存在チェックが行われたことを確認
      expect(prisma.projectTag.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_name: {
            projectId: 'project-123',
            name: '新機能',
          },
        },
      });

      // タグ作成が行われたことを確認
      expect(prisma.projectTag.create).toHaveBeenCalledWith({
        data: {
          name: '新機能',
          projectId: 'project-123',
        },
      });

      // レスポンス検証
      expect(response.status).toBe(201);
      expect(response.body).toEqual(newTag);
    });

    it('should reject tag creation when tag name already exists', async () => {
      // モックユーザー（プロジェクト管理者）
      const mockManager = {
        id: 'user-123',
        email: 'manager@example.com',
        role: Role.USER,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: mockManager.id,
      };

      // 既存タグ
      const existingTag = {
        id: 'tag-456',
        name: '既存タグ',
        projectId: 'project-123',
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.projectTag.findUnique as jest.Mock).mockResolvedValue(existingTag); // タグがすでに存在する

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // リクエストボディをモック（既存タグと同じ名前）
      const reqBody = {
        name: '既存タグ',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProjectTag(req, {
        params: { projectId: 'project-123' },
      });

      // タグ作成が行われていないことを確認
      expect(prisma.projectTag.create).not.toHaveBeenCalled();

      // エラーレスポンス検証（既に存在するタグ）
      expect(response.status).toBe(409); // Conflict
      expect(response.body).toHaveProperty('error');
    });

    it('should reject without authentication', async () => {
      // 認証なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 認証ヘッダーなし
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        name: '新タグ',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProjectTag(req, {
        params: { projectId: 'project-123' },
      });

      // 管理権限チェックが行われていないことを確認
      expect(authUtils.canManageProject).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject without project management permission', async () => {
      // モックユーザー（一般メンバー）
      const mockMember = {
        id: 'user-123',
        email: 'member@example.com',
        role: Role.USER,
      };

      // 管理権限エラーレスポンス
      const forbiddenResponse = NextResponse.json(
        { error: 'このプロジェクトを管理する権限がありません' },
        { status: 403 }
      );

      // canManageProjectの失敗レスポンスをモック
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: false,
        error: forbiddenResponse,
      });

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockMember.id,
          'x-user-email': mockMember.email,
          'x-user-role': mockMember.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        name: '新タグ',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProjectTag(req, {
        params: { projectId: 'project-123' },
      });

      // エラーレスポンス検証
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject with invalid data', async () => {
      // モックユーザー（プロジェクト管理者）
      const mockManager = {
        id: 'user-123',
        email: 'manager@example.com',
        role: Role.USER,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: mockManager.id,
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // 空のタグ名のリクエストボディ
      const invalidReqBody = {
        name: '', // 空のタグ名
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(invalidReqBody),
      });

      // API呼び出し
      const response = await createProjectTag(req, {
        params: { projectId: 'project-123' },
      });

      // タグ存在チェックが行われていないことを確認
      expect(prisma.projectTag.findUnique).not.toHaveBeenCalled();
      
      // タグ作成が行われていないことを確認
      expect(prisma.projectTag.create).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject tag name that is too long', async () => {
      // モックユーザー（プロジェクト管理者）
      const mockManager = {
        id: 'user-123',
        email: 'manager@example.com',
        role: Role.USER,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: mockManager.id,
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // 長すぎるタグ名のリクエストボディ
      const invalidReqBody = {
        name: 'a'.repeat(51), // 50文字を超えるタグ名
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(invalidReqBody),
      });

      // API呼び出し
      const response = await createProjectTag(req, {
        params: { projectId: 'project-123' },
      });

      // タグ作成が行われていないことを確認
      expect(prisma.projectTag.create).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors', async () => {
      // モックユーザー（プロジェクト管理者）
      const mockManager = {
        id: 'user-123',
        email: 'manager@example.com',
        role: Role.USER,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: mockManager.id,
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.projectTag.findUnique as jest.Mock).mockResolvedValue(null);
      
      // データベースエラーをモック
      (prisma.projectTag.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        name: '新タグ',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProjectTag(req, {
        params: { projectId: 'project-123' },
      });

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