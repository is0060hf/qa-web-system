import { NextRequest } from 'next/server';
import { prismaMock } from '@/../jest/singleton';
import * as auth from '@/lib/utils/auth';
import * as apiUtils from '@/lib/utils/api';
import { GET, PATCH, DELETE } from '@/app/api/projects/[projectId]/questions/[questionId]/route';
import { Question, User, ProjectMember, Project, QuestionTag, Role, QuestionStatus } from '@prisma/client';

// モックデータ
const mockUser: User = {
  id: 'user1',
  name: 'テストユーザー',
  email: 'test@example.com',
  emailVerified: new Date(),
  role: Role.USER,
  password: 'hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdmin: User = {
  ...mockUser,
  id: 'admin1',
  role: Role.ADMIN,
};

const mockOtherUser: User = {
  ...mockUser,
  id: 'user2',
  email: 'other@example.com',
};

const mockProject: Project = {
  id: 'project1',
  name: 'テストプロジェクト',
  description: 'プロジェクトの説明',
  creatorId: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockQuestion: Question = {
  id: 'question1',
  title: 'テスト質問',
  content: '質問内容',
  projectId: 'project1',
  creatorId: 'user1',
  assigneeId: 'user2',
  status: QuestionStatus.NEW,
  priority: 'MEDIUM',
  deadline: new Date('2023-12-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTags = [
  {
    questionId: 'question1',
    tagId: 'tag1',
    tag: {
      id: 'tag1',
      name: 'タグ1',
      projectId: 'project1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
];

// モックリクエスト作成関数
const createMockRequest = (method: string, body?: any) => {
  const request = new Request('http://localhost/api/projects/project1/questions/question1', {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  }) as NextRequest;
  return request;
};

describe('質問詳細・更新・削除API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // canAccessProjectのモック
    jest.spyOn(auth, 'canAccessProject').mockImplementation(async (projectId, user) => {
      if (projectId === 'project1') {
        return {
          success: true,
          project: {
            ...mockProject,
            members: [
              { userId: 'user1', role: 'MEMBER' } as ProjectMember,
              { userId: 'user2', role: 'MEMBER' } as ProjectMember,
            ],
          },
        };
      }
      return {
        success: false,
        error: {
          json: () => ({ error: 'プロジェクトへのアクセス権がありません' }),
          status: 403,
        },
      };
    });
  });

  describe('GET - 質問詳細取得', () => {
    it('認証済みユーザーが自分の質問の詳細を取得できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue({
        ...mockQuestion,
        creator: mockUser,
        assignee: mockOtherUser,
        tags: mockTags,
        answers: [],
        answerForm: null,
      } as any);

      // リクエスト実行
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.id).toBe('question1');
      expect(data.title).toBe('テスト質問');
      expect(data.creator.id).toBe('user1');
      expect(data.assignee.id).toBe('user2');
    });

    it('認証済みユーザーが自分がアサインされた質問の詳細を取得できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockOtherUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue({
        ...mockQuestion,
        creator: mockUser,
        assignee: mockOtherUser,
        tags: mockTags,
        answers: [],
        answerForm: null,
      } as any);

      // リクエスト実行
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.id).toBe('question1');
    });

    it('管理者が任意の質問の詳細を取得できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAdmin);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue({
        ...mockQuestion,
        creator: mockUser,
        assignee: mockOtherUser,
        tags: mockTags,
        answers: [],
        answerForm: null,
      } as any);

      // リクエスト実行
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.id).toBe('question1');
    });

    it('質問が見つからない場合は404を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(null);

      // リクエスト実行
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { projectId: 'project1', questionId: 'nonexistent' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('関係のないユーザーが質問詳細にアクセスしようとすると403を返すこと', async () => {
      // getUserFromRequestのモック
      const unrelatedUser = { ...mockUser, id: 'unrelated' };
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(unrelatedUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue({
        ...mockQuestion,
        creator: mockUser,
        assignee: mockOtherUser,
        tags: mockTags,
        answers: [],
        answerForm: null,
      } as any);

      // リクエスト実行
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });
  });

  describe('PATCH - 質問更新', () => {
    it('質問作成者が質問を更新できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: {
          title: '更新されたタイトル',
          content: '更新された内容',
          assigneeId: 'user2',
          deadline: '2024-01-31',
          priority: 'HIGH',
          tagIds: ['tag1', 'tag2'],
        },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue({
        ...mockQuestion,
        tags: [{ tagId: 'tag1' }] as any,
      });

      prismaMock.projectTag.findMany.mockResolvedValue([
        { id: 'tag1', projectId: 'project1', name: 'タグ1' },
        { id: 'tag2', projectId: 'project1', name: 'タグ2' },
      ] as any);

      prismaMock.$transaction.mockImplementation(async (callback) => {
        const updatedQuestion = {
          ...mockQuestion,
          title: '更新されたタイトル',
          content: '更新された内容',
          assigneeId: 'user2',
          deadline: new Date('2024-01-31'),
          priority: 'HIGH',
          creator: mockUser,
          assignee: mockOtherUser,
          tags: [
            { tagId: 'tag1', tag: { id: 'tag1', name: 'タグ1' } },
            { tagId: 'tag2', tag: { id: 'tag2', name: 'タグ2' } },
          ],
        };
        return callback(prismaMock as any).then(() => updatedQuestion);
      });

      // リクエスト実行
      const requestBody = {
        title: '更新されたタイトル',
        content: '更新された内容',
        assigneeId: 'user2',
        deadline: '2024-01-31',
        priority: 'HIGH',
        tagIds: ['tag1', 'tag2'],
      };
      const request = createMockRequest('PATCH', requestBody);
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.title).toBe('更新されたタイトル');
      expect(data.content).toBe('更新された内容');
      expect(data.priority).toBe('HIGH');
    });

    it('権限のないユーザーが質問を更新しようとすると403を返すこと', async () => {
      // getUserFromRequestのモック
      const unrelatedUser = { ...mockUser, id: 'unrelated' };
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(unrelatedUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);

      // リクエスト実行
      const requestBody = { title: '更新されたタイトル' };
      const request = createMockRequest('PATCH', requestBody);
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('クローズされた質問は更新できないこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue({
        ...mockQuestion,
        status: QuestionStatus.CLOSED,
      } as any);

      // リクエスト実行
      const requestBody = { title: '更新されたタイトル' };
      const request = createMockRequest('PATCH', requestBody);
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('バリデーションエラー時は400を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: false,
        error: {
          json: () => ({ error: 'バリデーションエラー' }),
          status: 400,
        },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);

      // リクエスト実行
      const requestBody = { title: '' }; // 空のタイトル（バリデーションエラー）
      const request = createMockRequest('PATCH', requestBody);
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('DELETE - 質問削除', () => {
    it('質問作成者が質問を削除できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.$transaction.mockResolvedValue([]);
      prismaMock.question.delete.mockResolvedValue(mockQuestion as any);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
    });

    it('管理者が質問を削除できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAdmin);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.$transaction.mockResolvedValue([]);
      prismaMock.question.delete.mockResolvedValue(mockQuestion as any);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
    });

    it('権限のないユーザーが質問を削除しようとすると403を返すこと', async () => {
      // getUserFromRequestのモック
      const unrelatedUser = { ...mockUser, id: 'unrelated' };
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(unrelatedUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('存在しない質問を削除しようとすると404を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(null);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'nonexistent' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });
}); 