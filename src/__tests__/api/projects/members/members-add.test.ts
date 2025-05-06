import { NextRequest, NextResponse } from 'next/server';
import { POST as addProjectMember } from '@/app/api/projects/[projectId]/members/route';
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

describe('Project Members API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects/{projectId}/members (Add Member)', () => {
    it('should add a new member to project with valid data', async () => {
      // モックユーザー（プロジェクト管理者）
      const mockManager = {
        id: 'user-123',
        email: 'manager@example.com',
        role: Role.USER,
      };

      // 追加対象のユーザー
      const mockTargetUser = {
        id: 'user-456',
        name: '新規メンバー',
        email: 'newmember@example.com',
        role: Role.USER,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: mockManager.id,
        creator: {
          id: mockManager.id,
          name: 'プロジェクト管理者',
          email: mockManager.email,
        },
      };

      // 新規メンバーシップ
      const newMembership = {
        id: 'membership-1',
        projectId: 'project-123',
        userId: mockTargetUser.id,
        role: ProjectRole.MEMBER,
        user: {
          id: mockTargetUser.id,
          name: mockTargetUser.name,
          email: mockTargetUser.email,
        },
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null); // メンバーがまだ存在しない
      (prisma.projectMember.create as jest.Mock).mockResolvedValue(newMembership);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
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
        userId: mockTargetUser.id,
        role: ProjectRole.MEMBER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await addProjectMember(req, {
        params: { projectId: 'project-123' },
      });

      // 管理権限チェックが行われたことを確認
      expect(authUtils.canManageProject).toHaveBeenCalledWith('project-123', mockManager);

      // ユーザー存在チェックが行われたことを確認
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockTargetUser.id },
      });

      // メンバーが既に存在しないか確認されたことを確認
      expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId: 'project-123',
            userId: mockTargetUser.id,
          },
        },
      });

      // メンバー追加が行われたことを確認
      expect(prisma.projectMember.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-123',
          userId: mockTargetUser.id,
          role: ProjectRole.MEMBER,
        },
        include: expect.objectContaining({
          user: expect.any(Object),
        }),
      });

      // レスポンス検証
      expect(response.status).toBe(201);
      expect(response.body).toEqual(newMembership);
    });

    it('should add a member with MANAGER role', async () => {
      // モックユーザー（プロジェクト管理者）
      const mockManager = {
        id: 'user-123',
        email: 'manager@example.com',
        role: Role.USER,
      };

      // 追加対象のユーザー
      const mockTargetUser = {
        id: 'user-456',
        name: '新規管理者',
        email: 'newmanager@example.com',
        role: Role.USER,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: mockManager.id,
      };

      // 新規メンバーシップ（管理者権限）
      const newMembership = {
        id: 'membership-1',
        projectId: 'project-123',
        userId: mockTargetUser.id,
        role: ProjectRole.MANAGER, // 管理者権限
        user: {
          id: mockTargetUser.id,
          name: mockTargetUser.name,
          email: mockTargetUser.email,
        },
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.projectMember.create as jest.Mock).mockResolvedValue(newMembership);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // 管理者権限でのリクエストボディ
      const reqBody = {
        userId: mockTargetUser.id,
        role: ProjectRole.MANAGER, // 管理者として追加
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await addProjectMember(req, {
        params: { projectId: 'project-123' },
      });

      // メンバー追加が管理者権限で行われたことを確認
      expect(prisma.projectMember.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-123',
          userId: mockTargetUser.id,
          role: ProjectRole.MANAGER, // 管理者権限
        },
        include: expect.any(Object),
      });

      // レスポンス検証
      expect(response.status).toBe(201);
    });

    it('should reject when user already a member', async () => {
      // モックユーザー（プロジェクト管理者）
      const mockManager = {
        id: 'user-123',
        email: 'manager@example.com',
        role: Role.USER,
      };

      // 追加対象のユーザー
      const mockTargetUser = {
        id: 'user-456',
        name: '既存メンバー',
        email: 'existingmember@example.com',
        role: Role.USER,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: mockManager.id,
      };

      // 既存のメンバーシップ
      const existingMembership = {
        id: 'membership-1',
        projectId: 'project-123',
        userId: mockTargetUser.id,
        role: ProjectRole.MEMBER,
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(existingMembership); // メンバーが既に存在する

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
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
        userId: mockTargetUser.id,
        role: ProjectRole.MEMBER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await addProjectMember(req, {
        params: { projectId: 'project-123' },
      });

      // メンバー追加が行われていないことを確認
      expect(prisma.projectMember.create).not.toHaveBeenCalled();

      // エラーレスポンス検証（既に存在するメンバー）
      expect(response.status).toBe(409); // Conflict
      expect(response.body).toHaveProperty('error');
    });

    it('should reject when target user does not exist', async () => {
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
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // 対象ユーザーが存在しない

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
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
        userId: 'non-existent-user',
        role: ProjectRole.MEMBER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await addProjectMember(req, {
        params: { projectId: 'project-123' },
      });

      // メンバー追加が行われていないことを確認
      expect(prisma.projectMember.create).not.toHaveBeenCalled();

      // エラーレスポンス検証（存在しないユーザー）
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject without authentication', async () => {
      // 認証なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 認証ヘッダーなし
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        userId: 'user-456',
        role: ProjectRole.MEMBER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await addProjectMember(req, {
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
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
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
        userId: 'user-456',
        role: ProjectRole.MEMBER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await addProjectMember(req, {
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
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // 不完全なリクエストボディ（userIdなし）
      const invalidReqBody = {
        role: ProjectRole.MEMBER,
        // userIdがない
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(invalidReqBody),
      });

      // API呼び出し
      const response = await addProjectMember(req, {
        params: { projectId: 'project-123' },
      });

      // ユーザー存在チェックが行われていないことを確認
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      
      // メンバー追加が行われていないことを確認
      expect(prisma.projectMember.create).not.toHaveBeenCalled();

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

      // 追加対象のユーザー
      const mockTargetUser = {
        id: 'user-456',
        name: '新規メンバー',
        email: 'newmember@example.com',
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
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockTargetUser);
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);
      
      // データベースエラーをモック
      (prisma.projectMember.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members', {
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
        userId: mockTargetUser.id,
        role: ProjectRole.MEMBER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await addProjectMember(req, {
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