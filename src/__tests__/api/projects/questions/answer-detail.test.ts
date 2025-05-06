import { NextRequest } from 'next/server';
import { prismaMock } from '@/../jest/singleton';
import * as auth from '@/lib/utils/auth';
import * as apiUtils from '@/lib/utils/api';
import { GET, PATCH, DELETE } from '@/app/api/projects/[projectId]/questions/[questionId]/answers/[answerId]/route';
import { Question, User, ProjectMember, Project, Role, QuestionStatus, Answer, MediaFile } from '@prisma/client';

// モックデータ
const mockUser: User = {
  id: 'user1',
  name: 'テストユーザー',
  email: 'test@example.com',
  role: Role.USER,
  password: 'hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAssignee: User = {
  ...mockUser,
  id: 'user2',
  name: 'テスト回答者',
  email: 'assignee@example.com',
};

const mockAdmin: User = {
  ...mockUser,
  id: 'admin1',
  role: Role.ADMIN,
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
  status: QuestionStatus.IN_PROGRESS,
  priority: 'MEDIUM',
  deadline: new Date('2023-12-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockClosedQuestion: Question = {
  ...mockQuestion,
  id: 'question2',
  status: QuestionStatus.CLOSED,
};

const mockAnswer: Answer = {
  id: 'answer1',
  content: 'テスト回答内容',
  questionId: 'question1',
  creatorId: 'user2',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMediaFile: MediaFile = {
  id: 'media1',
  fileName: 'test.jpg',
  fileSize: 1024,
  mimeType: 'image/jpeg',
  storageUrl: 'https://example.com/test.jpg',
  uploaderId: 'user2',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// モックリクエスト作成関数
const createMockRequest = (method: string, body?: any) => {
  const request = new Request('http://localhost/api/projects/project1/questions/question1/answers/answer1', {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  }) as NextRequest;
  return request;
};

describe('回答詳細・更新・削除API', () => {
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

  describe('GET - 回答詳細取得', () => {
    it('プロジェクトメンバーが回答詳細を取得できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.findUnique.mockResolvedValue({
        ...mockAnswer,
        creator: mockAssignee,
        mediaFiles: [],
        formData: [],
      } as any);

      // リクエスト実行
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { projectId: 'project1', questionId: 'question1', answerId: 'answer1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.id).toBe('answer1');
      expect(data.content).toBe('テスト回答内容');
      expect(data.creator.id).toBe('user2');
    });

    it('管理者が回答詳細を取得できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAdmin);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.findUnique.mockResolvedValue({
        ...mockAnswer,
        creator: mockAssignee,
        mediaFiles: [],
        formData: [],
      } as any);

      // リクエスト実行
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { projectId: 'project1', questionId: 'question1', answerId: 'answer1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.id).toBe('answer1');
    });

    it('存在しない質問の回答を取得しようとすると404を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(null);

      // リクエスト実行
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { projectId: 'project1', questionId: 'nonexistent', answerId: 'answer1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('存在しない回答を取得しようとすると404を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.findUnique.mockResolvedValue(null);

      // リクエスト実行
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { projectId: 'project1', questionId: 'question1', answerId: 'nonexistent' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });

  describe('PATCH - 回答更新', () => {
    it('回答作成者が回答を更新できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAssignee);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: {
          content: '更新された回答内容',
        },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.findUnique.mockResolvedValue(mockAnswer as any);
      prismaMock.answer.update.mockResolvedValue({
        ...mockAnswer,
        content: '更新された回答内容',
        creator: mockAssignee,
        mediaFiles: [],
        formData: [],
      } as any);

      // リクエスト実行
      const requestBody = {
        content: '更新された回答内容',
      };
      const request = createMockRequest('PATCH', requestBody);
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1', answerId: 'answer1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.id).toBe('answer1');
      expect(data.content).toBe('更新された回答内容');
    });

    it('回答作成者でないユーザーが回答を更新しようとすると403を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.findUnique.mockResolvedValue(mockAnswer as any);

      // リクエスト実行
      const requestBody = {
        content: '更新された回答内容',
      };
      const request = createMockRequest('PATCH', requestBody);
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1', answerId: 'answer1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('クローズされた質問の回答は更新できないこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAssignee);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockClosedQuestion as any);
      prismaMock.answer.findUnique.mockResolvedValue({
        ...mockAnswer,
        questionId: 'question2',
      } as any);

      // リクエスト実行
      const requestBody = {
        content: '更新された回答内容',
      };
      const request = createMockRequest('PATCH', requestBody);
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question2', answerId: 'answer1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('バリデーションエラー時は400を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAssignee);

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
      prismaMock.answer.findUnique.mockResolvedValue(mockAnswer as any);

      // リクエスト実行
      const requestBody = {
        content: '', // 空の内容（バリデーションエラー）
      };
      const request = createMockRequest('PATCH', requestBody);
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1', answerId: 'answer1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('DELETE - 回答削除', () => {
    it('回答作成者が回答を削除できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAssignee);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.findUnique.mockResolvedValue(mockAnswer as any);
      prismaMock.$transaction.mockResolvedValue([]);
      prismaMock.answer.delete.mockResolvedValue(mockAnswer as any);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1', answerId: 'answer1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
    });

    it('管理者が回答を削除できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAdmin);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.findUnique.mockResolvedValue(mockAnswer as any);
      prismaMock.$transaction.mockResolvedValue([]);
      prismaMock.answer.delete.mockResolvedValue(mockAnswer as any);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1', answerId: 'answer1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
    });

    it('回答作成者でないユーザーが回答を削除しようとすると403を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.findUnique.mockResolvedValue(mockAnswer as any);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1', answerId: 'answer1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('クローズされた質問の回答は削除できないこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAssignee);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockClosedQuestion as any);
      prismaMock.answer.findUnique.mockResolvedValue({
        ...mockAnswer,
        questionId: 'question2',
      } as any);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question2', answerId: 'answer1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('存在しない回答を削除しようとすると404を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAssignee);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.findUnique.mockResolvedValue(null);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1', answerId: 'nonexistent' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });
}); 