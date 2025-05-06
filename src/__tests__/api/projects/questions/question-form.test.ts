import { NextRequest } from 'next/server';
import { prismaMock } from '@/../jest/singleton';
import * as auth from '@/lib/utils/auth';
import * as apiUtils from '@/lib/utils/api';
import { GET, POST, DELETE } from '@/app/api/projects/[projectId]/questions/[questionId]/form/route';
import { Question, User, ProjectMember, Project, AnswerForm, AnswerFormField, Role, QuestionStatus } from '@prisma/client';

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

const mockAnswerForm: AnswerForm = {
  id: 'form1',
  questionId: 'question1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockFormFields: AnswerFormField[] = [
  {
    id: 'field1',
    answerFormId: 'form1',
    label: 'テキストフィールド',
    fieldType: 'TEXT',
    options: [],
    isRequired: true,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'field2',
    answerFormId: 'form1',
    label: 'セレクトフィールド',
    fieldType: 'SELECT',
    options: ['オプション1', 'オプション2', 'オプション3'],
    isRequired: false,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// モックリクエスト作成関数
const createMockRequest = (method: string, body?: any) => {
  const request = new Request('http://localhost/api/projects/project1/questions/question1/form', {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  }) as NextRequest;
  return request;
};

describe('回答フォーム管理API', () => {
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

  describe('GET - 回答フォーム取得', () => {
    it('認証済みユーザーが回答フォームを取得できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answerForm.findUnique.mockResolvedValue({
        ...mockAnswerForm,
        fields: mockFormFields,
      } as any);

      // リクエスト実行
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.id).toBe('form1');
      expect(data.fields).toHaveLength(2);
      expect(data.fields[0].label).toBe('テキストフィールド');
      expect(data.fields[1].fieldType).toBe('SELECT');
    });

    it('存在しない質問の回答フォームを取得しようとすると404を返すこと', async () => {
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

    it('質問に回答フォームが設定されていない場合は404を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answerForm.findUnique.mockResolvedValue(null);

      // リクエスト実行
      const request = createMockRequest('GET');
      const response = await GET(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST - 回答フォーム作成・更新', () => {
    it('質問作成者が新規回答フォームを作成できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: {
          fields: [
            {
              label: 'テキストフィールド',
              fieldType: 'TEXT',
              isRequired: true,
              order: 0,
            },
            {
              label: 'セレクトフィールド',
              fieldType: 'SELECT',
              options: ['オプション1', 'オプション2', 'オプション3'],
              isRequired: false,
              order: 1,
            },
          ],
        },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.$transaction.mockImplementation(async (callback) => {
        prismaMock.answerForm.findUnique.mockResolvedValue(null);
        prismaMock.answerForm.create.mockResolvedValue(mockAnswerForm as any);
        prismaMock.answerFormField.create.mockImplementation((data: any) => {
          return Promise.resolve({
            id: `field${data.data.order + 1}`,
            answerFormId: 'form1',
            label: data.data.label,
            fieldType: data.data.fieldType,
            options: data.data.options || [],
            isRequired: data.data.isRequired,
            order: data.data.order,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });
        return callback(prismaMock as any).then(() => ({
          ...mockAnswerForm,
          fields: mockFormFields,
        }));
      });

      // リクエスト実行
      const requestBody = {
        fields: [
          {
            label: 'テキストフィールド',
            fieldType: 'TEXT',
            isRequired: true,
            order: 0,
          },
          {
            label: 'セレクトフィールド',
            fieldType: 'SELECT',
            options: ['オプション1', 'オプション2', 'オプション3'],
            isRequired: false,
            order: 1,
          },
        ],
      };
      const request = createMockRequest('POST', requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(201);
      expect(data.id).toBe('form1');
      expect(data.fields).toHaveLength(2);
      expect(data.fields[0].fieldType).toBe('TEXT');
      expect(data.fields[1].options).toEqual(['オプション1', 'オプション2', 'オプション3']);
    });

    it('質問作成者が既存の回答フォームを更新できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: {
          fields: [
            {
              label: '更新されたフィールド',
              fieldType: 'TEXT',
              isRequired: true,
              order: 0,
            },
          ],
        },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.$transaction.mockImplementation(async (callback) => {
        prismaMock.answerForm.findUnique.mockResolvedValue({
          ...mockAnswerForm,
          fields: mockFormFields,
        } as any);
        prismaMock.answerFormField.deleteMany.mockResolvedValue({ count: 2 });
        prismaMock.answerForm.update.mockResolvedValue(mockAnswerForm as any);
        prismaMock.answerFormField.create.mockImplementation((data: any) => {
          return Promise.resolve({
            id: 'updatedField1',
            answerFormId: 'form1',
            label: data.data.label,
            fieldType: data.data.fieldType,
            options: data.data.options || [],
            isRequired: data.data.isRequired,
            order: data.data.order,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });
        return callback(prismaMock as any).then(() => ({
          ...mockAnswerForm,
          fields: [{
            id: 'updatedField1',
            answerFormId: 'form1',
            label: '更新されたフィールド',
            fieldType: 'TEXT',
            options: [],
            isRequired: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }],
        }));
      });

      // リクエスト実行
      const requestBody = {
        fields: [
          {
            label: '更新されたフィールド',
            fieldType: 'TEXT',
            isRequired: true,
            order: 0,
          },
        ],
      };
      const request = createMockRequest('POST', requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(201);
      expect(data.id).toBe('form1');
      expect(data.fields).toHaveLength(1);
      expect(data.fields[0].label).toBe('更新されたフィールド');
    });

    it('権限のないユーザーが回答フォームを作成しようとすると403を返すこと', async () => {
      // getUserFromRequestのモック
      const unrelatedUser = { ...mockUser, id: 'unrelated' };
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(unrelatedUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);

      // リクエスト実行
      const requestBody = {
        fields: [
          {
            label: 'テキストフィールド',
            fieldType: 'TEXT',
            isRequired: true,
            order: 0,
          },
        ],
      };
      const request = createMockRequest('POST', requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('クローズされた質問の回答フォームを作成しようとすると400を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue({
        ...mockQuestion,
        status: QuestionStatus.CLOSED,
      } as any);

      // リクエスト実行
      const requestBody = {
        fields: [
          {
            label: 'テキストフィールド',
            fieldType: 'TEXT',
            isRequired: true,
            order: 0,
          },
        ],
      };
      const request = createMockRequest('POST', requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'question1' } });
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
      const requestBody = {
        fields: [], // 空のフィールド（バリデーションエラー）
      };
      const request = createMockRequest('POST', requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('DELETE - 回答フォーム削除', () => {
    it('質問作成者が回答フォームを削除できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answerForm.findUnique.mockResolvedValue(mockAnswerForm as any);
      prismaMock.answer.count.mockResolvedValue(0); // 回答はまだない
      prismaMock.$transaction.mockResolvedValue([
        { count: 2 }, // フィールド削除
        mockAnswerForm, // フォーム削除
      ]);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
    });

    it('管理者が回答フォームを削除できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAdmin);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answerForm.findUnique.mockResolvedValue(mockAnswerForm as any);
      prismaMock.answer.count.mockResolvedValue(0); // 回答はまだない
      prismaMock.$transaction.mockResolvedValue([
        { count: 2 }, // フィールド削除
        mockAnswerForm, // フォーム削除
      ]);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
    });

    it('権限のないユーザーが回答フォームを削除しようとすると403を返すこと', async () => {
      // getUserFromRequestのモック
      const unrelatedUser = { ...mockUser, id: 'unrelated' };
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(unrelatedUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answerForm.findUnique.mockResolvedValue(mockAnswerForm as any);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('クローズされた質問の回答フォームを削除しようとすると400を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue({
        ...mockQuestion,
        status: QuestionStatus.CLOSED,
      } as any);
      prismaMock.answerForm.findUnique.mockResolvedValue(mockAnswerForm as any);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('フォームが存在しない場合は404を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answerForm.findUnique.mockResolvedValue(null);

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('既に回答がある質問の回答フォームを削除しようとすると400を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.answerForm.findUnique.mockResolvedValue(mockAnswerForm as any);
      prismaMock.answer.count.mockResolvedValue(1); // 回答が既にある

      // リクエスト実行
      const request = createMockRequest('DELETE');
      const response = await DELETE(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
}); 