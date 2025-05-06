import { NextRequest, NextResponse } from 'next/server';
import { POST as createProjectInvitation } from '@/app/api/projects/[projectId]/invitations/route';
import prisma from '@/lib/db';
import { Role, ProjectRole, InvitationStatus } from '@prisma/client';
import * as authUtils from '@/lib/utils/auth';
import crypto from 'crypto';

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

// cryptoをモック
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-token'),
  }),
}));

describe('Project Invitation API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects/{projectId}/invitations (Create Invitation)', () => {
    it('should create a new invitation with valid data', async () => {
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

      // 新規招待
      const newInvitation = {
        id: 'invitation-123',
        email: 'invitee@example.com',
        projectId: 'project-123',
        inviterId: mockManager.id,
        token: 'mock-token',
        expiresAt: expect.any(Date),
        status: InvitationStatus.PENDING,
        createdAt: expect.any(Date),
        inviter: {
          id: mockManager.id,
          name: 'プロジェクト管理者',
          email: mockManager.email,
        },
        project: {
          id: 'project-123',
          name: 'テストプロジェクト',
        },
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // 招待ユーザーがまだ存在しない
      (prisma.invitation.findFirst as jest.Mock).mockResolvedValue(null); // 招待がまだ存在しない
      (prisma.invitation.create as jest.Mock).mockResolvedValue(newInvitation);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
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
        email: 'invitee@example.com',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProjectInvitation(req, {
        params: { projectId: 'project-123' },
      });

      // 管理権限チェックが行われたことを確認
      expect(authUtils.canManageProject).toHaveBeenCalledWith('project-123', mockManager);

      // 招待作成が行われたことを確認
      expect(prisma.invitation.create).toHaveBeenCalledWith({
        data: {
          email: 'invitee@example.com',
          projectId: 'project-123',
          inviterId: mockManager.id,
          token: 'mock-token',
          expiresAt: expect.any(Date),
          status: 'PENDING',
        },
        include: expect.objectContaining({
          inviter: expect.any(Object),
          project: expect.any(Object),
        }),
      });

      // レスポンス検証
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('invitation');
    });

    it('should reject when inviting existing project member', async () => {
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

      // 既存ユーザー（すでにプロジェクトメンバー）
      const existingUser = {
        id: 'existing-user',
        email: 'member@example.com',
        name: '既存メンバー',
        role: Role.USER,
      };

      // 既存メンバーシップ
      const existingMembership = {
        id: 'membership-1',
        projectId: 'project-123',
        userId: existingUser.id,
        role: ProjectRole.MEMBER,
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(existingMembership); // 既にメンバー

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
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
        email: existingUser.email,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProjectInvitation(req, {
        params: { projectId: 'project-123' },
      });

      // 招待作成が行われていないことを確認
      expect(prisma.invitation.create).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject when invitation already exists', async () => {
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

      // 既存の招待
      const existingInvitation = {
        id: 'invitation-456',
        email: 'already@example.com',
        projectId: 'project-123',
        inviterId: mockManager.id,
        token: 'existing-token',
        expiresAt: new Date('2023-12-31'),
        status: InvitationStatus.PENDING,
        createdAt: new Date('2023-12-01'),
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // ユーザーはまだ存在しない
      (prisma.invitation.findFirst as jest.Mock).mockResolvedValue(existingInvitation); // 既に招待あり

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
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
        email: 'already@example.com',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProjectInvitation(req, {
        params: { projectId: 'project-123' },
      });

      // 招待作成が行われていないことを確認
      expect(prisma.invitation.create).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject without authentication', async () => {
      // 認証なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 認証ヘッダーなし
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        email: 'invitee@example.com',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProjectInvitation(req, {
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
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
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
        email: 'invitee@example.com',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProjectInvitation(req, {
        params: { projectId: 'project-123' },
      });

      // エラーレスポンス検証
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject with invalid email format', async () => {
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
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });
      
      // 無効なメールアドレスのリクエストボディ
      const invalidReqBody = {
        email: 'invalid-email', // 無効なメールアドレス
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(invalidReqBody),
      });

      // API呼び出し
      const response = await createProjectInvitation(req, {
        params: { projectId: 'project-123' },
      });

      // ユーザー存在チェックが行われていないことを確認
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      
      // 招待作成が行われていないことを確認
      expect(prisma.invitation.create).not.toHaveBeenCalled();

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
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.invitation.findFirst as jest.Mock).mockResolvedValue(null);
      
      // データベースエラーをモック
      (prisma.invitation.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations', {
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
        email: 'invitee@example.com',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createProjectInvitation(req, {
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