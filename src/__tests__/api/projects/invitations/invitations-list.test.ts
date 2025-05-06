import { NextRequest, NextResponse } from 'next/server';
import { GET as getProjectInvitations } from '@/app/api/projects/[projectId]/invitations/route';
import prisma from '@/lib/db';
import { Role, ProjectRole, InvitationStatus } from '@prisma/client';
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

describe('Project Invitations API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects/{projectId}/invitations', () => {
    it('should return all project invitations for project managers', async () => {
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
        creator: {
          id: 'creator-user',
          name: 'プロジェクト作成者',
          email: 'creator@example.com',
        },
        members: [
          {
            id: 'membership-1',
            userId: mockManager.id,
            role: ProjectRole.MANAGER, // 管理者権限
            user: {
              id: mockManager.id,
              name: 'プロジェクト管理者',
              email: mockManager.email,
            },
          },
        ],
      };

      // モック招待
      const mockInvitations = [
        {
          id: 'invitation-1',
          email: 'invitee1@example.com',
          projectId: 'project-123',
          inviterId: mockManager.id,
          status: InvitationStatus.PENDING,
          token: 'token1',
          expiresAt: new Date('2023-12-31'),
          createdAt: new Date('2023-12-01'),
          inviter: {
            id: mockManager.id,
            name: 'プロジェクト管理者',
            email: mockManager.email,
          },
        },
        {
          id: 'invitation-2',
          email: 'invitee2@example.com',
          projectId: 'project-123',
          inviterId: 'other-user',
          status: InvitationStatus.PENDING,
          token: 'token2',
          expiresAt: new Date('2023-12-31'),
          createdAt: new Date('2023-12-02'),
          inviter: {
            id: 'other-user',
            name: '他のユーザー',
            email: 'other@example.com',
          },
        },
      ];

      // canAccessProjectの成功レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });

      // プロジェクト招待取得をモック
      (prisma.invitation.findMany as jest.Mock).mockResolvedValue(mockInvitations);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
        method: 'GET',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await getProjectInvitations(req, {
        params: { projectId: 'project-123' },
      });

      // アクセス権チェックが行われたことを確認
      expect(authUtils.canAccessProject).toHaveBeenCalledWith('project-123', mockManager);

      // 招待情報が取得されたことを確認
      expect(prisma.invitation.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        include: expect.objectContaining({
          inviter: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInvitations);
    });

    it('should return only self-invited invitations for regular members', async () => {
      // モックユーザー（一般メンバー）
      const mockMember = {
        id: 'user-123',
        email: 'member@example.com',
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
            userId: mockMember.id,
            role: ProjectRole.MEMBER, // 一般メンバー
            user: {
              id: mockMember.id,
              name: '一般メンバー',
              email: mockMember.email,
            },
          },
        ],
      };

      // 自分が送った招待のみ
      const selfInvitations = [
        {
          id: 'invitation-1',
          email: 'invitee1@example.com',
          projectId: 'project-123',
          inviterId: mockMember.id, // 自分が招待者
          status: InvitationStatus.PENDING,
          token: 'token1',
          expiresAt: new Date('2023-12-31'),
          createdAt: new Date('2023-12-01'),
          inviter: {
            id: mockMember.id,
            name: '一般メンバー',
            email: mockMember.email,
          },
        },
      ];

      // canAccessProjectの成功レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });

      // プロジェクト招待取得をモック（自分が送った招待のみ）
      (prisma.invitation.findMany as jest.Mock).mockResolvedValue(selfInvitations);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
        method: 'GET',
        headers: {
          'x-user-id': mockMember.id,
          'x-user-email': mockMember.email,
          'x-user-role': mockMember.role,
        },
      });

      // API呼び出し
      const response = await getProjectInvitations(req, {
        params: { projectId: 'project-123' },
      });

      // 招待情報が自分のものだけ取得されたことを確認
      expect(prisma.invitation.findMany).toHaveBeenCalledWith({
        where: { 
          projectId: 'project-123',
          inviterId: mockMember.id // 自分が送った招待のみ
        },
        include: expect.objectContaining({
          inviter: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual(selfInvitations);
    });

    it('should return all invitations for admin users', async () => {
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

      // モック招待
      const mockInvitations = [
        {
          id: 'invitation-1',
          email: 'invitee1@example.com',
          projectId: 'project-123',
          inviterId: 'user-1',
          status: InvitationStatus.PENDING,
          token: 'token1',
          expiresAt: new Date('2023-12-31'),
          createdAt: new Date('2023-12-01'),
          inviter: {
            id: 'user-1',
            name: 'ユーザー1',
            email: 'user1@example.com',
          },
        },
        {
          id: 'invitation-2',
          email: 'invitee2@example.com',
          projectId: 'project-123',
          inviterId: 'user-2',
          status: InvitationStatus.PENDING,
          token: 'token2',
          expiresAt: new Date('2023-12-31'),
          createdAt: new Date('2023-12-02'),
          inviter: {
            id: 'user-2',
            name: 'ユーザー2',
            email: 'user2@example.com',
          },
        },
      ];

      // canAccessProjectの成功レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: null, // 管理者はメンバーではない
      });

      // プロジェクト招待取得をモック
      (prisma.invitation.findMany as jest.Mock).mockResolvedValue(mockInvitations);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
        method: 'GET',
        headers: {
          'x-user-id': adminUser.id,
          'x-user-email': adminUser.email,
          'x-user-role': adminUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectInvitations(req, {
        params: { projectId: 'project-123' },
      });

      // 全ての招待情報が取得されたことを確認
      expect(prisma.invitation.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        include: expect.objectContaining({
          inviter: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInvitations);
    });

    it('should return empty array when project has no invitations', async () => {
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
        creator: {
          id: mockManager.id,
          name: 'プロジェクト管理者',
          email: mockManager.email,
        },
        members: [
          {
            id: 'membership-1',
            userId: mockManager.id,
            role: ProjectRole.MANAGER,
            user: {
              id: mockManager.id,
              name: 'プロジェクト管理者',
              email: mockManager.email,
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

      // 空の招待リストをモック
      (prisma.invitation.findMany as jest.Mock).mockResolvedValue([]);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
        method: 'GET',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await getProjectInvitations(req, {
        params: { projectId: 'project-123' },
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 401 for unauthenticated request', async () => {
      // 認証なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
        method: 'GET',
        // 認証ヘッダーなし
      });

      // API呼び出し
      const response = await getProjectInvitations(req, {
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
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectInvitations(req, {
        params: { projectId: 'project-123' },
      });

      // エラーレスポンス検証
      expect(response.status).toBe(403);
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
        creatorId: 'creator-user',
        members: [
          {
            id: 'membership-1',
            userId: mockManager.id,
            role: ProjectRole.MANAGER,
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
      (prisma.invitation.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
        method: 'GET',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await getProjectInvitations(req, {
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