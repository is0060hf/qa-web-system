import { NextRequest, NextResponse } from 'next/server';
import { GET as getProjectDetail } from '@/app/api/projects/[projectId]/route';
import { Role, ProjectRole } from '@prisma/client';
import * as authUtils from '@/lib/utils/auth';

// 型定義
type MockQuestion = {
  id: string;
  title: string;
  status: string;
  creatorId: string;
  createdAt: Date;
};

// jest.mockを先に実行（巻き上げ対策）
jest.mock('@/lib/db', () => {
  const mockPrisma = {
    projectTag: {
      findMany: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
  };
  
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

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

// モック化されたPrismaを取得
import { prisma as mockPrisma } from '@/lib/db';

describe('Project Detail API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects/{projectId}', () => {
    it('should return project details for authorized user', async () => {
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
        description: 'テストプロジェクトの説明',
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
            createdAt: new Date(),
            user: {
              id: mockUser.id,
              name: 'テストユーザー',
              email: mockUser.email,
              profileImage: null,
            },
          },
        ],
      };

      // モックタグ
      const mockTags = [
        { id: 'tag-1', name: 'タグ1', projectId: 'project-123' },
        { id: 'tag-2', name: 'タグ2', projectId: 'project-123' },
      ];

      // モック質問
      const mockQuestions: MockQuestion[] = [
        {
          id: 'question-1',
          title: '質問1',
          status: 'OPEN',
          creatorId: 'user-123',
          createdAt: new Date(),
        },
      ];

      // canAccessProjectの成功レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });

      // タグ取得をモック
      (mockPrisma.projectTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      // 質問取得をモック
      (mockPrisma.question.findMany as jest.Mock).mockResolvedValue(mockQuestions);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectDetail(req, {
        params: Promise.resolve({ projectId: 'project-123' }),
      });

      // アクセス権チェックが行われたことを確認
      expect(authUtils.canAccessProject).toHaveBeenCalledWith('project-123', mockUser);

      // タグ情報が取得されたことを確認
      expect(mockPrisma.projectTag.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
      });

      // 質問情報が取得されたことを確認
      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        select: {
          id: true,
          title: true,
          status: true,
          creatorId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ...mockProject,
        tags: mockTags,
        questions: mockQuestions,
        members: [
          {
            id: 'membership-1',
            userId: mockUser.id,
            userName: 'テストユーザー',
            userEmail: mockUser.email,
            role: ProjectRole.MEMBER,
            joinedAt: mockProject.members[0].createdAt,
            profileImage: null
          }
        ]
      });
    });

    it('should return project details for admin user', async () => {
      // モック管理者ユーザー
      const adminUser = {
        id: 'admin-user',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };

      // モックプロジェクト
      const mockProject = {
        id: 'project-123',
        name: 'テストプロジェクト',
        description: 'テストプロジェクトの説明',
        creatorId: 'creator-user',
        creator: {
          id: 'creator-user',
          name: 'プロジェクト作成者',
          email: 'creator@example.com',
        },
        members: [],
      };

      // モックタグ
      const mockTags = [
        { id: 'tag-1', name: 'タグ1', projectId: 'project-123' },
      ];

      // モック質問
      const mockQuestions: MockQuestion[] = [];

      // canAccessProjectの成功レスポンスをモック
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: null, // 管理者はメンバーでなくてもアクセス可能
      });

      // タグ取得をモック
      (mockPrisma.projectTag.findMany as jest.Mock).mockResolvedValue(mockTags);

      // 質問取得をモック
      (mockPrisma.question.findMany as jest.Mock).mockResolvedValue(mockQuestions);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123', {
        method: 'GET',
        headers: {
          'x-user-id': adminUser.id,
          'x-user-email': adminUser.email,
          'x-user-role': adminUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectDetail(req, {
        params: Promise.resolve({ projectId: 'project-123' }),
      });

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ...mockProject,
        tags: mockTags,
        questions: mockQuestions,
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      // 認証なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects/project-123', {
        method: 'GET',
        // 認証ヘッダーなし
      });

      // API呼び出し
      const response = await getProjectDetail(req, {
        params: Promise.resolve({ projectId: 'project-123' }),
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
      const req = new NextRequest('https://example.com/api/projects/project-123', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectDetail(req, {
        params: Promise.resolve({ projectId: 'project-123' }),
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
      const response = await getProjectDetail(req, {
        params: Promise.resolve({ projectId: 'non-existent' }),
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

      // サーバーエラーをモック
      (authUtils.canAccessProject as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123', {
        method: 'GET',
        headers: {
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });

      // API呼び出し
      const response = await getProjectDetail(req, {
        params: Promise.resolve({ projectId: 'project-123' }),
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