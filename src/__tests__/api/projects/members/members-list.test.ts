import { NextRequest, NextResponse } from 'next/server';
import { GET as getProjectMembers } from '@/app/api/projects/[projectId]/members/route';
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

describe('Project Members API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects/{projectId}/members', () => {
    it('should return project members for authorized user', async () => {
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
        creator: {
          id: 'creator-user',
          name: 'プロジェクト作成者',
          email: 'creator@example.com',
        },
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

      // モックプロジェクトメンバー
      const mockMembers = [
        {
          id: 'membership-1',
          projectId: 'project-123',
          userId: mockUser.id,
          role: ProjectRole.MEMBER,
          user: {
            id: mockUser.id,
            name: 'テストユーザー',
            email: mockUser.email,
          },
        },
        {
          id: 'membership-2',
          projectId: 'project-123',
          userId: 'creator-user',
          role: ProjectRole.MANAGER,
          user: {
            id: 'creator-user',
            name: 'プロジェクト作成者',
            email: 'creator@example.com',
          },
        },
      ];

      // canAccessProjectの成功レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });

      // プロジェクトメンバー取得をモック
      (prisma.projectMember.findMany as jest.Mock).mockResolvedValue(mockMembers);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectMembers(req, {
        params: { projectId: 'project-123' },
      });

      // アクセス権チェックが行われたことを確認
      expect(authUtils.canAccessProject).toHaveBeenCalledWith('project-123', mockUser);

      // メンバー情報が取得されたことを確認
      expect(prisma.projectMember.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        include: expect.objectContaining({
          user: expect.any(Object),
        }),
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMembers);
    });

    it('should return members for admin user regardless of membership', async () => {
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
        creator: {
          id: 'creator-user',
          name: 'プロジェクト作成者',
          email: 'creator@example.com',
        },
        members: [],
      };

      // モックプロジェクトメンバー
      const mockMembers = [
        {
          id: 'membership-2',
          projectId: 'project-123',
          userId: 'creator-user',
          role: ProjectRole.MANAGER,
          user: {
            id: 'creator-user',
            name: 'プロジェクト作成者',
            email: 'creator@example.com',
          },
        },
        {
          id: 'membership-3',
          projectId: 'project-123',
          userId: 'other-user',
          role: ProjectRole.MEMBER,
          user: {
            id: 'other-user',
            name: '一般メンバー',
            email: 'member@example.com',
          },
        },
      ];

      // canAccessProjectの成功レスポンスをモック（管理者はアクセス可能）
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: null, // 管理者はメンバーではない
      });

      // プロジェクトメンバー取得をモック
      (prisma.projectMember.findMany as jest.Mock).mockResolvedValue(mockMembers);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
        method: 'GET',
        headers: {
          'x-user-id': adminUser.id,
          'x-user-email': adminUser.email,
          'x-user-role': adminUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectMembers(req, {
        params: { projectId: 'project-123' },
      });

      // アクセス権チェックが行われたことを確認
      expect(authUtils.canAccessProject).toHaveBeenCalledWith('project-123', adminUser);

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMembers);
    });

    it('should return empty array when project has no members', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // モックプロジェクト（メンバーなし）
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: mockUser.id,
        creator: {
          id: mockUser.id,
          name: 'テストユーザー',
          email: mockUser.email,
        },
        members: [],
      };

      // canAccessProjectの成功レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: null, // 作成者はmembersには含まれない
      });

      // 空のメンバーリストをモック
      (prisma.projectMember.findMany as jest.Mock).mockResolvedValue([]);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectMembers(req, {
        params: { projectId: 'project-123' },
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 401 for unauthenticated request', async () => {
      // 認証なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
        method: 'GET',
        // 認証ヘッダーなし
      });

      // API呼び出し
      const response = await getProjectMembers(req, {
        params: { projectId: 'project-123' },
      });

      // アクセス権チェックが行われていないことを確認
      expect(authUtils.canAccessProject).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for unauthorized user', async () => {
      // モックユーザー
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
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectMembers(req, {
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
      const req = new NextRequest('https://example.com/api/projects/non-existent', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectMembers(req, {
        params: { projectId: 'non-existent' },
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
        members: [],
      };

      // canAccessProjectの成功レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: null,
      });

      // データベースエラーをモック
      (prisma.projectMember.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectMembers(req, {
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