import { NextRequest, NextResponse } from 'next/server';
import { GET as getProjectTags } from '@/app/api/projects/[projectId]/tags/route';
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
  canAccessProject: jest.fn(),
}));

describe('Project Tags API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects/{projectId}/tags', () => {
    it('should return project tags for authorized user', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: 'creator-user',
        members: [
          {
            id: 'membership-1',
            userId: mockUser.id,
            role: ProjectRole.MEMBER,
            user: {
              id: mockUser.id,
              name: 'テストユーザー',
              email: mockUser.email,
            },
          },
        ],
      };

      // モックプロジェクトタグ
      const mockTags = [
        {
          id: 'tag-1',
          name: 'バグ',
          projectId: 'project-123',
        },
        {
          id: 'tag-2',
          name: '機能追加',
          projectId: 'project-123',
        },
        {
          id: 'tag-3',
          name: '緊急',
          projectId: 'project-123',
        },
      ];

      // canAccessProjectの成功レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });

      // プロジェクトタグ取得をモック
      (prisma.projectTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectTags(req, {
        params: { projectId: 'project-123' },
      });

      // アクセス権チェックが行われたことを確認
      expect(authUtils.canAccessProject).toHaveBeenCalledWith('project-123', mockUser);

      // タグ情報が取得されたことを確認
      expect(prisma.projectTag.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        orderBy: { name: 'asc' },
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTags);
    });

    it('should return empty array when project has no tags', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: mockUser.id,
        members: [
          {
            id: 'membership-1',
            userId: mockUser.id,
            role: ProjectRole.MEMBER,
            user: {
              id: mockUser.id,
              name: 'テストユーザー',
              email: mockUser.email,
            },
          },
        ],
      };

      // canAccessProjectの成功レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });

      // 空のタグリストをモック
      (prisma.projectTag.findMany as jest.Mock).mockResolvedValue([]);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectTags(req, {
        params: { projectId: 'project-123' },
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return tags for admin user regardless of membership', async () => {
      // モック管理者ユーザー
      const adminUser = {
        id: 'admin-user',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };

      // モックプロジェクト（管理者はメンバーでない）
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: 'creator-user',
        members: [],
      };

      // モックプロジェクトタグ
      const mockTags = [
        {
          id: 'tag-1',
          name: 'バグ',
          projectId: 'project-123',
        },
        {
          id: 'tag-2',
          name: '機能追加',
          projectId: 'project-123',
        },
      ];

      // canAccessProjectの成功レスポンスをモック（管理者はアクセス可能）
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: null, // 管理者はメンバーではない
      });

      // プロジェクトタグ取得をモック
      (prisma.projectTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'GET',
        headers: {
          'x-user-id': adminUser.id,
          'x-user-email': adminUser.email,
          'x-user-role': adminUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectTags(req, {
        params: { projectId: 'project-123' },
      });

      // アクセス権チェックが行われたことを確認
      expect(authUtils.canAccessProject).toHaveBeenCalledWith('project-123', adminUser);

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTags);
    });

    it('should return 401 for unauthenticated request', async () => {
      // 認証なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'GET',
        // 認証ヘッダーなし
      });

      // API呼び出し
      const response = await getProjectTags(req, {
        params: { projectId: 'project-123' },
      });

      // アクセス権チェックが行われていないことを確認
      expect(authUtils.canAccessProject).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for unauthorized user', async () => {
      // モックユーザー（プロジェクトメンバーでない）
      const mockUser = {
        id: 'user-456',
        email: 'nonmember@example.com',
        role: Role.USER,
      };

      // 権限エラーレスポンス
      const forbiddenResponse = NextResponse.json(
        { error: 'このプロジェクトにアクセスする権限がありません' },
        { status: 403 }
      );

      // canAccessProjectの失敗レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: false,
        error: forbiddenResponse,
      });

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectTags(req, {
        params: { projectId: 'project-123' },
      });

      // エラーレスポンス検証
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent project', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // 存在しないプロジェクトエラーレスポンス
      const notFoundResponse = NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      );

      // canAccessProjectの失敗レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: false,
        error: notFoundResponse,
      });

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/non-existent-project/tags', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectTags(req, {
        params: { projectId: 'non-existent-project' },
      });

      // エラーレスポンス検証
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: 'creator-user',
        members: [
          {
            id: 'membership-1',
            userId: mockUser.id,
            role: ProjectRole.MEMBER,
          },
        ],
      };

      // canAccessProjectの成功レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });

      // データベースエラーをモック
      (prisma.projectTag.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectTags(req, {
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