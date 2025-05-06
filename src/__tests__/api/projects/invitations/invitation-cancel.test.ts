import { NextRequest, NextResponse } from 'next/server';
import { DELETE as cancelInvitation } from '@/app/api/projects/[projectId]/invitations/[invitationId]/route';
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
  canManageProject: jest.fn(),
}));

describe('Project Invitation Cancel API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /api/projects/{projectId}/invitations/{invitationId}', () => {
    it('should cancel an invitation successfully (by project manager)', async () => {
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

      // モック招待
      const mockInvitation = {
        id: 'invitation-123',
        email: 'invitee@example.com',
        projectId: 'project-123',
        inviterId: 'other-user', // 別のユーザーが招待を送信
        token: 'token-123',
        status: InvitationStatus.PENDING,
        expiresAt: new Date('2023-12-31'),
        createdAt: new Date('2023-12-01'),
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation);
      (prisma.invitation.delete as jest.Mock).mockResolvedValue(mockInvitation);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations/invitation-123', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await cancelInvitation(req, {
        params: { projectId: 'project-123', invitationId: 'invitation-123' },
      });

      // 管理権限チェックが行われたことを確認
      expect(authUtils.canManageProject).toHaveBeenCalledWith('project-123', mockManager);

      // 招待の存在確認が行われたことを確認
      expect(prisma.invitation.findUnique).toHaveBeenCalledWith({
        where: { id: 'invitation-123' },
      });

      // 招待削除が行われたことを確認
      expect(prisma.invitation.delete).toHaveBeenCalledWith({
        where: { id: 'invitation-123' },
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should cancel an invitation successfully (by invitation creator)', async () => {
      // モックユーザー（招待作成者）
      const mockInviter = {
        id: 'user-123',
        email: 'inviter@example.com',
        role: Role.USER,
      };

      // モック招待（自分が作成した招待）
      const mockInvitation = {
        id: 'invitation-123',
        email: 'invitee@example.com',
        projectId: 'project-123',
        inviterId: mockInviter.id, // 自分が招待を送信
        token: 'token-123',
        status: InvitationStatus.PENDING,
        expiresAt: new Date('2023-12-31'),
        createdAt: new Date('2023-12-01'),
      };

      // 管理権限が無いと仮定（一般メンバー）
      const forbiddenResponse = NextResponse.json(
        { error: 'このプロジェクトを管理する権限がありません' },
        { status: 403 }
      );

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: false,
        error: forbiddenResponse,
      });
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation);
      (prisma.invitation.delete as jest.Mock).mockResolvedValue(mockInvitation);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations/invitation-123', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockInviter.id,
          'x-user-email': mockInviter.email,
          'x-user-role': mockInviter.role,
        },
      });

      // API呼び出し
      const response = await cancelInvitation(req, {
        params: { projectId: 'project-123', invitationId: 'invitation-123' },
      });

      // 管理権限チェックが行われたことを確認（失敗するが自分が作成した招待なので削除可能）
      expect(authUtils.canManageProject).toHaveBeenCalledWith('project-123', mockInviter);

      // 招待削除が行われたことを確認
      expect(prisma.invitation.delete).toHaveBeenCalledWith({
        where: { id: 'invitation-123' },
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject cancellation when invitation does not exist', async () => {
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
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(null); // 招待が存在しない

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations/non-existent', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await cancelInvitation(req, {
        params: { projectId: 'project-123', invitationId: 'non-existent' },
      });

      // 招待削除が行われていないことを確認
      expect(prisma.invitation.delete).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject when invitation belongs to another project', async () => {
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

      // 別プロジェクトの招待
      const otherProjectInvitation = {
        id: 'invitation-456',
        email: 'invitee@example.com',
        projectId: 'other-project', // 違うプロジェクトID
        inviterId: 'other-user',
        token: 'token-456',
        status: InvitationStatus.PENDING,
        expiresAt: new Date('2023-12-31'),
        createdAt: new Date('2023-12-01'),
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(otherProjectInvitation);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations/invitation-456', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await cancelInvitation(req, {
        params: { projectId: 'project-123', invitationId: 'invitation-456' },
      });

      // 招待削除が行われていないことを確認
      expect(prisma.invitation.delete).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject when invitation is not in PENDING status', async () => {
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

      // すでに応答済みの招待
      const respondedInvitation = {
        id: 'invitation-123',
        email: 'invitee@example.com',
        projectId: 'project-123',
        inviterId: 'other-user',
        token: 'token-123',
        status: InvitationStatus.ACCEPTED, // 既に承認済み
        expiresAt: new Date('2023-12-31'),
        createdAt: new Date('2023-12-01'),
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(respondedInvitation);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations/invitation-123', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await cancelInvitation(req, {
        params: { projectId: 'project-123', invitationId: 'invitation-123' },
      });

      // 招待削除が行われていないことを確認
      expect(prisma.invitation.delete).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject without authentication', async () => {
      // 認証なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations/invitation-123', {
        method: 'DELETE',
        // 認証ヘッダーなし
      });

      // API呼び出し
      const response = await cancelInvitation(req, {
        params: { projectId: 'project-123', invitationId: 'invitation-123' },
      });

      // 招待の存在チェックが行われていないことを確認
      expect(prisma.invitation.findUnique).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject when user has no rights to cancel invitation', async () => {
      // モックユーザー（権限のない一般ユーザー）
      const mockUser = {
        id: 'user-789',
        email: 'regular@example.com',
        role: Role.USER,
      };

      // 招待（別のユーザーが作成）
      const mockInvitation = {
        id: 'invitation-123',
        email: 'invitee@example.com',
        projectId: 'project-123',
        inviterId: 'other-user', // 別のユーザーが作成した招待
        token: 'token-123',
        status: InvitationStatus.PENDING,
        expiresAt: new Date('2023-12-31'),
        createdAt: new Date('2023-12-01'),
      };

      // 管理権限が無いと仮定
      const forbiddenResponse = NextResponse.json(
        { error: 'このプロジェクトを管理する権限がありません' },
        { status: 403 }
      );

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: false,
        error: forbiddenResponse,
      });
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations/invitation-123', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await cancelInvitation(req, {
        params: { projectId: 'project-123', invitationId: 'invitation-123' },
      });

      // 招待削除が行われていないことを確認
      expect(prisma.invitation.delete).not.toHaveBeenCalled();

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
      };

      // モック招待
      const mockInvitation = {
        id: 'invitation-123',
        email: 'invitee@example.com',
        projectId: 'project-123',
        inviterId: 'other-user',
        token: 'token-123',
        status: InvitationStatus.PENDING,
        expiresAt: new Date('2023-12-31'),
        createdAt: new Date('2023-12-01'),
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation);
      
      // データベースエラーをモック
      (prisma.invitation.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/invitations/invitation-123', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await cancelInvitation(req, {
        params: { projectId: 'project-123', invitationId: 'invitation-123' },
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