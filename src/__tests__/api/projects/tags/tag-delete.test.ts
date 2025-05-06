import { NextRequest, NextResponse } from 'next/server';
import { DELETE as deleteProjectTag } from '@/app/api/projects/[projectId]/tags/[tagId]/route';
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

describe('Project Tag Delete API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /api/projects/{projectId}/tags/{tagId}', () => {
    it('should delete a tag successfully without questions', async () => {
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

      // モックタグ（質問に関連付けられていない）
      const mockTag = {
        id: 'tag-123',
        name: '削除対象タグ',
        projectId: 'project-123',
        questions: [], // 質問に関連付けされていない
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.projectTag.findUnique as jest.Mock).mockResolvedValue(mockTag);
      (prisma.projectTag.delete as jest.Mock).mockResolvedValue(mockTag);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags/tag-123', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await deleteProjectTag(req, {
        params: { projectId: 'project-123', tagId: 'tag-123' },
      });

      // 管理権限チェックが行われたことを確認
      expect(authUtils.canManageProject).toHaveBeenCalledWith('project-123', mockManager);

      // タグの存在確認とプロジェクト確認が行われたことを確認
      expect(prisma.projectTag.findUnique).toHaveBeenCalledWith({
        where: { id: 'tag-123' },
        include: {
          questions: true,
        },
      });

      // タグ削除が行われたことを確認
      expect(prisma.projectTag.delete).toHaveBeenCalledWith({
        where: { id: 'tag-123' },
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 when tag is used by questions', async () => {
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

      // モックタグ（質問に関連付けられている）
      const mockTag = {
        id: 'tag-123',
        name: '使用中タグ',
        projectId: 'project-123',
        questions: [
          { id: 'question-1', questionId: 'q1', tagId: 'tag-123' },
          { id: 'question-2', questionId: 'q2', tagId: 'tag-123' },
        ], // 質問に関連付けされている
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.projectTag.findUnique as jest.Mock).mockResolvedValue(mockTag);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags/tag-123', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await deleteProjectTag(req, {
        params: { projectId: 'project-123', tagId: 'tag-123' },
      });

      // タグ削除が行われていないことを確認
      expect(prisma.projectTag.delete).not.toHaveBeenCalled();

      // レスポンス検証
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('needsConfirmation', true);
      expect(response.body).toHaveProperty('usingQuestions', 2);
    });

    it('should return 404 when tag does not exist', async () => {
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
      (prisma.projectTag.findUnique as jest.Mock).mockResolvedValue(null); // タグが存在しない

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags/non-existent', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await deleteProjectTag(req, {
        params: { projectId: 'project-123', tagId: 'non-existent' },
      });

      // タグ削除が行われていないことを確認
      expect(prisma.projectTag.delete).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 when tag belongs to another project', async () => {
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

      // 別プロジェクトのタグ
      const otherProjectTag = {
        id: 'tag-456',
        name: '別プロジェクトのタグ',
        projectId: 'other-project', // 違うプロジェクトID
        questions: [],
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.projectTag.findUnique as jest.Mock).mockResolvedValue(otherProjectTag);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags/tag-456', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await deleteProjectTag(req, {
        params: { projectId: 'project-123', tagId: 'tag-456' },
      });

      // タグ削除が行われていないことを確認
      expect(prisma.projectTag.delete).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      // 認証なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects/project-123/tags/tag-123', {
        method: 'DELETE',
        // 認証ヘッダーなし
      });

      // API呼び出し
      const response = await deleteProjectTag(req, {
        params: { projectId: 'project-123', tagId: 'tag-123' },
      });

      // 管理権限チェックが行われていないことを確認
      expect(authUtils.canManageProject).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 without project management permission', async () => {
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
      const req = new NextRequest('https://example.com/api/projects/project-123/tags/tag-123', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockMember.id,
          'x-user-email': mockMember.email,
          'x-user-role': mockMember.role,
        },
      });

      // API呼び出し
      const response = await deleteProjectTag(req, {
        params: { projectId: 'project-123', tagId: 'tag-123' },
      });

      // タグ削除が行われていないことを確認
      expect(prisma.projectTag.delete).not.toHaveBeenCalled();

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

      // モックタグ
      const mockTag = {
        id: 'tag-123',
        name: '削除対象タグ',
        projectId: 'project-123',
        questions: [],
      };

      // モック設定
      (authUtils.canManageProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
      });
      (prisma.projectTag.findUnique as jest.Mock).mockResolvedValue(mockTag);
      
      // データベースエラーをモック
      (prisma.projectTag.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/tags/tag-123', {
        method: 'DELETE',
        headers: {
          'x-user-id': mockManager.id,
          'x-user-email': mockManager.email,
          'x-user-role': mockManager.role,
        },
      });

      // API呼び出し
      const response = await deleteProjectTag(req, {
        params: { projectId: 'project-123', tagId: 'tag-123' },
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