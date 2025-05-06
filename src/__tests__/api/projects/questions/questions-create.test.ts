import { NextRequest, NextResponse } from 'next/server';
import { POST as createQuestion } from '@/app/api/projects/[projectId]/questions/route';
import prisma from '@/lib/db';
import { Role, ProjectRole, QuestionPriority } from '@prisma/client';
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

describe('Questions API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects/{projectId}/questions (Create Question)', () => {
    it('should create a new question with valid data', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // モック回答担当者
      const mockAssignee = {
        id: 'assignee-456',
        name: '回答担当者',
        email: 'assignee@example.com',
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

      // モックタグ
      const mockTags = [
        { id: 'tag-1', name: 'タグ1', projectId: 'project-123' },
        { id: 'tag-2', name: 'タグ2', projectId: 'project-123' },
      ];

      // 新規質問
      const newQuestion = {
        id: 'question-123',
        title: 'テスト質問',
        content: '質問の内容です',
        projectId: 'project-123',
        creatorId: mockUser.id,
        assigneeId: mockAssignee.id,
        deadline: new Date('2023-12-31'),
        priority: QuestionPriority.HIGH,
        status: 'NEW',
        creator: {
          id: mockUser.id,
          name: 'テストユーザー',
          email: mockUser.email,
        },
        assignee: {
          id: mockAssignee.id,
          name: '回答担当者',
          email: mockAssignee.email,
        },
        tags: [
          { tagId: 'tag-1', tag: mockTags[0] },
          { tagId: 'tag-2', tag: mockTags[1] },
        ],
      };

      // モック設定
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAssignee);
      (prisma.question.create as jest.Mock).mockResolvedValue(newQuestion);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        title: 'テスト質問',
        content: '質問の内容です',
        assigneeId: mockAssignee.id,
        deadline: '2023-12-31T00:00:00Z',
        priority: QuestionPriority.HIGH,
        tagIds: ['tag-1', 'tag-2'],
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createQuestion(req, {
        params: { projectId: 'project-123' },
      });

      // プロジェクトアクセスチェックが行われたことを確認
      expect(authUtils.canAccessProject).toHaveBeenCalledWith('project-123', mockUser);

      // 回答者の存在チェックが行われたことを確認
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockAssignee.id },
      });

      // 質問作成が行われたことを確認
      expect(prisma.question.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          title: reqBody.title,
          content: reqBody.content,
          projectId: 'project-123',
          creatorId: mockUser.id,
          assigneeId: mockAssignee.id,
          priority: reqBody.priority,
          deadline: expect.any(Date),
        }),
        include: expect.any(Object),
      }));

      // 通知作成が行われたことを確認
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockAssignee.id,
          type: 'NEW_QUESTION_ASSIGNED',
          message: expect.stringContaining(reqBody.title),
          relatedId: newQuestion.id,
        }),
      });

      // レスポンス検証
      expect(response.status).toBe(201);
      expect(response.body).toEqual(newQuestion);
    });

    it('should create a question with minimal required fields', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // モック回答担当者
      const mockAssignee = {
        id: 'assignee-456',
        name: '回答担当者',
        email: 'assignee@example.com',
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

      // 最小限の新規質問
      const minimalQuestion = {
        id: 'question-123',
        title: '最小限質問',
        content: '質問内容',
        projectId: 'project-123',
        creatorId: mockUser.id,
        assigneeId: mockAssignee.id,
        priority: 'MEDIUM', // デフォルト値
        deadline: null,
        status: 'NEW',
        creator: {
          id: mockUser.id,
          name: 'テストユーザー',
          email: mockUser.email,
        },
        assignee: {
          id: mockAssignee.id,
          name: '回答担当者',
          email: mockAssignee.email,
        },
        tags: [],
      };

      // モック設定
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAssignee);
      (prisma.question.create as jest.Mock).mockResolvedValue(minimalQuestion);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });
      
      // 最小限のリクエストボディ
      const minimalReqBody = {
        title: '最小限質問',
        content: '質問内容',
        assigneeId: mockAssignee.id,
        // 他のフィールドはなし
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(minimalReqBody),
      });

      // API呼び出し
      const response = await createQuestion(req, {
        params: { projectId: 'project-123' },
      });

      // 質問作成が行われたことを確認
      expect(prisma.question.create).toHaveBeenCalled();

      // レスポンス検証
      expect(response.status).toBe(201);
    });

    it('should reject question creation without authentication', async () => {
      // 認証なしのリクエスト
      const req = new NextRequest('https://example.com/api/projects/project-123/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 認証ヘッダーなし
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        title: 'テスト質問',
        content: '質問の内容です',
        assigneeId: 'assignee-456',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createQuestion(req, {
        params: { projectId: 'project-123' },
      });

      // アクセス権チェックが行われていないことを確認
      expect(authUtils.canAccessProject).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject question creation without project access', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
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
      const req = new NextRequest('https://example.com/api/projects/project-123/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        title: 'テスト質問',
        content: '質問の内容です',
        assigneeId: 'assignee-456',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createQuestion(req, {
        params: { projectId: 'project-123' },
      });

      // エラーレスポンス検証
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject question with invalid assignee', async () => {
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

      // モック設定
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });
      
      // 存在しない回答者
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        title: 'テスト質問',
        content: '質問の内容です',
        assigneeId: 'non-existent-user',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createQuestion(req, {
        params: { projectId: 'project-123' },
      });

      // エラーレスポンス検証
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject question with invalid data', async () => {
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

      // モック設定
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });
      
      // 不完全なリクエストボディ（タイトルなし）
      const invalidReqBody = {
        // titleがない
        content: '質問の内容です',
        assigneeId: 'assignee-456',
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(invalidReqBody),
      });

      // API呼び出し
      const response = await createQuestion(req, {
        params: { projectId: 'project-123' },
      });

      // 質問作成が行われていないことを確認
      expect(prisma.question.create).not.toHaveBeenCalled();

      // エラーレスポンス検証
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors during question creation', async () => {
      // モックユーザー
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: Role.USER,
      };

      // モック回答担当者
      const mockAssignee = {
        id: 'assignee-456',
        name: '回答担当者',
        email: 'assignee@example.com',
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

      // モック設定
      (authUtils.canAccessProject as jest.Mock).mockResolvedValue({
        success: true,
        project: mockProject,
        membership: mockProject.members[0],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAssignee);
      
      // DBエラーをモック
      (prisma.question.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // リクエスト作成
      const req = new NextRequest('https://example.com/api/projects/project-123/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': mockUser.id,
          'x-user-email': mockUser.email,
          'x-user-role': mockUser.role,
        },
      });
      
      // リクエストボディをモック
      const reqBody = {
        title: 'テスト質問',
        content: '質問の内容です',
        assigneeId: mockAssignee.id,
      };
      
      // json()メソッドをモック
      Object.defineProperty(req, 'json', {
        value: jest.fn().mockResolvedValue(reqBody),
      });

      // API呼び出し
      const response = await createQuestion(req, {
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