import { NextRequest } from 'next/server';
import { prismaMock } from '@/../jest/singleton';
import * as auth from '@/lib/utils/auth';
import * as apiUtils from '@/lib/utils/api';
import { PATCH } from '@/app/api/projects/[projectId]/questions/[questionId]/status/route';
import { Question, User, ProjectMember, Project, Role, QuestionStatus } from '@prisma/client';

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
  status: QuestionStatus.NEW,
  priority: 'MEDIUM',
  deadline: new Date('2023-12-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// モックリクエスト作成関数
const createMockRequest = (body: any) => {
  const request = new Request('http://localhost/api/projects/project1/questions/question1/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }) as NextRequest;
  return request;
};

describe('質問ステータス管理API', () => {
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

  describe('PATCH - ステータス更新', () => {
    it('回答者が質問ステータスを「回答中」に変更できること', async () => {
      const assigneeUser = { ...mockUser, id: 'user2' };
      
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(assigneeUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: { status: QuestionStatus.IN_PROGRESS },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.question.update.mockResolvedValue({
        ...mockQuestion,
        status: QuestionStatus.IN_PROGRESS,
        creator: mockUser,
        assignee: assigneeUser,
      } as any);

      // リクエスト実行
      const request = createMockRequest({ status: QuestionStatus.IN_PROGRESS });
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.status).toBe(QuestionStatus.IN_PROGRESS);
    });

    it('回答者が質問ステータスを「承認待ち」に変更できること（回答あり）', async () => {
      const assigneeUser = { ...mockUser, id: 'user2' };
      
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(assigneeUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: { status: QuestionStatus.PENDING_APPROVAL },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.count.mockResolvedValue(1); // 回答が1つある
      prismaMock.question.update.mockResolvedValue({
        ...mockQuestion,
        status: QuestionStatus.PENDING_APPROVAL,
        creator: mockUser,
        assignee: assigneeUser,
      } as any);
      prismaMock.notification.create.mockResolvedValue({} as any);

      // リクエスト実行
      const request = createMockRequest({ status: QuestionStatus.PENDING_APPROVAL });
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.status).toBe(QuestionStatus.PENDING_APPROVAL);
      
      // 通知が作成されたことを確認
      expect(prismaMock.notification.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user1', // 質問作成者
          type: 'NEW_ANSWER_POSTED',
        }),
      }));
    });

    it('回答者が質問ステータスを「承認待ち」に変更しようとしても回答がなければ400エラーとなること', async () => {
      const assigneeUser = { ...mockUser, id: 'user2' };
      
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(assigneeUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: { status: QuestionStatus.PENDING_APPROVAL },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.count.mockResolvedValue(0); // 回答がない

      // リクエスト実行
      const request = createMockRequest({ status: QuestionStatus.PENDING_APPROVAL });
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('質問作成者が質問ステータスを「クローズ」に変更できること（回答あり）', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: { status: QuestionStatus.CLOSED },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.count.mockResolvedValue(1); // 回答が1つある
      prismaMock.question.update.mockResolvedValue({
        ...mockQuestion,
        status: QuestionStatus.CLOSED,
        creator: mockUser,
        assignee: { ...mockUser, id: 'user2' },
      } as any);
      prismaMock.notification.create.mockResolvedValue({} as any);

      // リクエスト実行
      const request = createMockRequest({ status: QuestionStatus.CLOSED });
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.status).toBe(QuestionStatus.CLOSED);
      
      // 通知が作成されたことを確認
      expect(prismaMock.notification.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user2', // 回答者
          type: 'ANSWERED_QUESTION_CLOSED',
        }),
      }));
    });

    it('質問作成者が質問ステータスを「クローズ」に変更しようとしても回答がなければ400エラーとなること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: { status: QuestionStatus.CLOSED },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answer.count.mockResolvedValue(0); // 回答がない

      // リクエスト実行
      const request = createMockRequest({ status: QuestionStatus.CLOSED });
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('関係のないユーザーが質問ステータスを「回答中」に変更しようとすると403を返すこと', async () => {
      const unrelatedUser = { ...mockUser, id: 'unrelated' };
      
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(unrelatedUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: { status: QuestionStatus.IN_PROGRESS },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);

      // リクエスト実行
      const request = createMockRequest({ status: QuestionStatus.IN_PROGRESS });
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('質問作成者でないユーザーが質問ステータスを「クローズ」に変更しようとすると403を返すこと', async () => {
      const otherUser = { ...mockUser, id: 'user2' }; // 回答者（質問作成者ではない）
      
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(otherUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: { status: QuestionStatus.CLOSED },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);

      // リクエスト実行
      const request = createMockRequest({ status: QuestionStatus.CLOSED });
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('質問ステータスを「新規」に変更しようとすると400を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: { status: QuestionStatus.NEW },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);

      // リクエスト実行
      const request = createMockRequest({ status: QuestionStatus.NEW });
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

      // リクエスト実行
      const request = createMockRequest({ status: 'INVALID_STATUS' });
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('存在しない質問のステータスを更新しようとすると404を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: { status: QuestionStatus.IN_PROGRESS },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(null);

      // リクエスト実行
      const request = createMockRequest({ status: QuestionStatus.IN_PROGRESS });
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'nonexistent' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('管理者が任意の質問のステータスを変更できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAdmin);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: { status: QuestionStatus.IN_PROGRESS },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.question.update.mockResolvedValue({
        ...mockQuestion,
        status: QuestionStatus.IN_PROGRESS,
        creator: mockUser,
        assignee: { ...mockUser, id: 'user2' },
      } as any);

      // リクエスト実行
      const request = createMockRequest({ status: QuestionStatus.IN_PROGRESS });
      const response = await PATCH(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.status).toBe(QuestionStatus.IN_PROGRESS);
    });
  });
}); 