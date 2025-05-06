import { NextRequest, NextResponse } from 'next/server';
import { PATCH as updateMemberRole } from '@/app/api/projects/[projectId]/members/[memberId]/route';
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

describe('Project Member Role Update API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/projects/{projectId}/members/{memberId}', () => {
    it('should update member role with valid data', async () => {
      // モックユーザー（プロジェクト管理者）
      const mockManager = {
        id: 'user-123',
        email: 'manager@example.com',
        role: Role.USER,
      };

      // 更新対象のユーザー
      const mockTargetUser = {
        id: 'user-456',
        name: 'メンバー',
        email: 'member@example.com',
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: 'creator-user',
      };

      // モックメンバーシップ（更新前）
      const existingMembership = {
        id: 'membership-1',
        projectId: 'project-123',
        userId: mockTargetUser.id,
        role: ProjectRole.MEMBER,
        user: mockTargetUser,
      };

      // 更新後のメンバーシップ
      const updatedMembership = {
        ...existingMembership,
        role: ProjectRole.MANAGER, // 一般メンバーから管理者に変更
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
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(existingMembership);
      (prisma.projectMember.update as jest.Mock).mockResolvedValue(updatedMembership);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members/membership-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // リクエストボディをモック（管理者ロールに変更）
      const reqBody = {
        role: ProjectRole.MANAGER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await updateMemberRole(req, {
        params: { projectId: 'project-123', memberId: 'membership-1' },
      });

      // 管理権限チェックが行われたことを確認
      expect(authUtils.canManageProject).toHaveBeenCalledWith('project-123', mockManager);

      // メンバーシップ存在チェックが行われたことを確認
      expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
        where: { id: 'membership-1' },
        include: {
          user: true,
        },
      });

      // ロール更新が行われたことを確認
      expect(prisma.projectMember.update).toHaveBeenCalledWith({
        where: { id: 'membership-1' },
        data: { role: ProjectRole.MANAGER },
        include: expect.objectContaining({
          user: expect.any(Object),
        }),
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedMembership);
    });

    it('should change role from MANAGER to MEMBER', async () => {
      // モックユーザー（プロジェクト管理者）
      const mockManager = {
        id: 'user-123',
        email: 'manager@example.com',
        role: Role.USER,
      };

      // 更新対象のユーザー
      const mockTargetUser = {
        id: 'user-456',
        name: '管理者',
        email: 'demote@example.com',
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: 'creator-user',
      };

      // モックメンバーシップ（更新前）
      const existingMembership = {
        id: 'membership-1',
        projectId: 'project-123',
        userId: mockTargetUser.id,
        role: ProjectRole.MANAGER, // 現在は管理者
        user: mockTargetUser,
      };

      // 更新後のメンバーシップ
      const updatedMembership = {
        ...existingMembership,
        role: ProjectRole.MEMBER, // 管理者から一般メンバーに降格
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
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(existingMembership);
      (prisma.projectMember.update as jest.Mock).mockResolvedValue(updatedMembership);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members/membership-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // リクエストボディをモック（一般メンバーロールに変更）
      const reqBody = {
        role: ProjectRole.MEMBER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await updateMemberRole(req, {
        params: { projectId: 'project-123', memberId: 'membership-1' },
      });

      // ロール更新が行われたことを確認
      expect(prisma.projectMember.update).toHaveBeenCalledWith({
        where: { id: 'membership-1' },
        data: { role: ProjectRole.MEMBER },
        include: expect.any(Object),
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedMembership);
    });

    it('should reject updating project creator role', async () => {
      // モックユーザー（プロジェクト管理者）
      const mockManager = {
        id: 'user-123',
        email: 'manager@example.com',
        role: Role.USER,
      };

      // プロジェクト作成者
      const creatorUser = {
        id: 'creator-user',
        name: '作成者',
        email: 'creator@example.com',
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: creatorUser.id, // 作成者ID
      };

      // 作成者のメンバーシップ
      const creatorMembership = {
        id: 'membership-1',
        projectId: 'project-123',
        userId: creatorUser.id,
        role: ProjectRole.MANAGER,
        user: creatorUser,
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(creatorMembership);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members/membership-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // リクエストボディをモック（作成者のロールを一般メンバーに変更しようとする）
      const reqBody = {
        role: ProjectRole.MEMBER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await updateMemberRole(req, {
        params: { projectId: 'project-123', memberId: 'membership-1' },
      });

      // ロール更新が行われていないことを確認
      expect(prisma.projectMember.update).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject when membership does not exist', async () => {
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

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null); // メンバーシップが存在しない

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members/non-existent', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        role: ProjectRole.MANAGER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await updateMemberRole(req, {
        params: { projectId: 'project-123', memberId: 'non-existent' },
      });

      // ロール更新が行われていないことを確認
      expect(prisma.projectMember.update).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject without authentication', async () => {
      // 認証なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects/project-123/members/membership-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // 認証ヘッダーなし
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        role: ProjectRole.MANAGER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await updateMemberRole(req, {
        params: { projectId: 'project-123', memberId: 'membership-1' },
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
        id: 'user-789',
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
      const req = new NextRequest('https://example.com/api/projects/project-123/members/membership-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockMember.id,
          'x-user-email': mockMember.email,
          'x-user-role': mockMember.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        role: ProjectRole.MANAGER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await updateMemberRole(req, {
        params: { projectId: 'project-123', memberId: 'membership-1' },
      });

      // エラーレスポンス検証
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject with invalid role data', async () => {
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

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members/membership-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // 無効なリクエストボディ
      const invalidReqBody = {
        role: 'INVALID_ROLE' // 存在しないロール
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(invalidReqBody),
      });

      // API呼び出し
      const response = await updateMemberRole(req, {
        params: { projectId: 'project-123', memberId: 'membership-1' },
      });

      // メンバー検索が行われていないことを確認
      expect(prisma.projectMember.findUnique).not.toHaveBeenCalled();
      
      // ロール更新が行われていないことを確認
      expect(prisma.projectMember.update).not.toHaveBeenCalled();

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

      // 更新対象のユーザー
      const mockTargetUser = {
        id: 'user-456',
        name: 'メンバー',
        email: 'member@example.com',
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        creatorId: 'creator-user',
      };

      // モックメンバーシップ
      const existingMembership = {
        id: 'membership-1',
        projectId: 'project-123',
        userId: mockTargetUser.id,
        role: ProjectRole.MEMBER,
        user: mockTargetUser,
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(existingMembership);
      
      // データベースエラーをモック
      (prisma.projectMember.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/members/membership-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        role: ProjectRole.MANAGER,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await updateMemberRole(req, {
        params: { projectId: 'project-123', memberId: 'membership-1' },
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