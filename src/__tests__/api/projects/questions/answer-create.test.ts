import { NextRequest } from 'next/server';
import { prismaMock } from '@/../jest/singleton';
import * as auth from '@/lib/utils/auth';
import * as apiUtils from '@/lib/utils/api';
import { POST } from '@/app/api/projects/[projectId]/questions/[questionId]/answers/route';
import { Question, User, ProjectMember, Project, Role, QuestionStatus, MediaFile, AnswerForm, AnswerFormField } from '@prisma/client';

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
  status: QuestionStatus.NEW,
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
const createMockRequest = (body: any) => {
  const request = new Request('http://localhost/api/projects/project1/questions/question1/answers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }) as NextRequest;
  return request;
};

describe('回答作成API', () => {
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

  describe('POST - 回答作成', () => {
    it('割り当てられた回答者が回答を作成できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAssignee);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: {
          content: 'テスト回答内容',
          mediaFileIds: ['media1'],
        },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue({
        ...mockQuestion,
        answerForm: {
          ...mockAnswerForm,
          fields: mockFormFields,
        },
      } as any);

      prismaMock.mediaFile.findMany.mockResolvedValue([mockMediaFile]);

      prismaMock.$transaction.mockImplementation(async (callback) => {
        const createdAnswer = {
          id: 'answer1',
          content: 'テスト回答内容',
          questionId: 'question1',
          creatorId: 'user2',
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: mockAssignee,
          mediaFiles: [
            {
              id: 'answerMedia1',
              answerId: 'answer1',
              mediaFileId: 'media1',
              mediaFile: mockMediaFile,
            },
          ],
          formData: [],
        };

        prismaMock.answer.create.mockResolvedValue({
          id: 'answer1',
          content: 'テスト回答内容',
          questionId: 'question1',
          creatorId: 'user2',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);

        prismaMock.answerMediaFile.create.mockResolvedValue({
          answerId: 'answer1',
          mediaFileId: 'media1',
        } as any);

        prismaMock.answer.findUnique.mockResolvedValue(createdAnswer as any);

        return callback(prismaMock as any).then(() => createdAnswer);
      });

      prismaMock.notification.create.mockResolvedValue({} as any);

      // リクエスト実行
      const requestBody = {
        content: 'テスト回答内容',
        mediaFileIds: ['media1'],
      };
      const request = createMockRequest(requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(201);
      expect(data.id).toBe('answer1');
      expect(data.content).toBe('テスト回答内容');
      expect(data.creator.id).toBe('user2');
      expect(data.mediaFiles).toHaveLength(1);
      expect(data.mediaFiles[0].mediaFile.id).toBe('media1');

      // 通知が作成されたことを確認
      expect(prismaMock.notification.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user1', // 質問作成者
          type: 'NEW_ANSWER_POSTED',
        }),
      }));
    });

    it('フォームデータを含む回答を作成できること', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAssignee);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: {
          content: 'テスト回答内容',
          formData: [
            {
              formFieldId: 'field1',
              value: 'テキスト回答',
            },
            {
              formFieldId: 'field2',
              value: 'オプション1',
            },
          ],
        },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue({
        ...mockQuestion,
        answerForm: {
          ...mockAnswerForm,
          fields: mockFormFields,
        },
      } as any);

      prismaMock.$transaction.mockImplementation(async (callback) => {
        const createdAnswer = {
          id: 'answer1',
          content: 'テスト回答内容',
          questionId: 'question1',
          creatorId: 'user2',
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: mockAssignee,
          mediaFiles: [],
          formData: [
            {
              id: 'formData1',
              answerId: 'answer1',
              formFieldId: 'field1',
              value: 'テキスト回答',
              mediaFileId: null,
              formField: mockFormFields[0],
              mediaFile: null,
            },
            {
              id: 'formData2',
              answerId: 'answer1',
              formFieldId: 'field2',
              value: 'オプション1',
              mediaFileId: null,
              formField: mockFormFields[1],
              mediaFile: null,
            },
          ],
        };

        prismaMock.answer.create.mockResolvedValue({
          id: 'answer1',
          content: 'テスト回答内容',
          questionId: 'question1',
          creatorId: 'user2',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);

        prismaMock.answerFormData.create.mockImplementation((data: any) => {
          return Promise.resolve({
            id: data.formFieldId === 'field1' ? 'formData1' : 'formData2',
            answerId: 'answer1',
            formFieldId: data.data.formFieldId,
            value: data.data.value,
            mediaFileId: null,
          });
        });

        prismaMock.answer.findUnique.mockResolvedValue(createdAnswer as any);

        return callback(prismaMock as any).then(() => createdAnswer);
      });

      prismaMock.notification.create.mockResolvedValue({} as any);

      // リクエスト実行
      const requestBody = {
        content: 'テスト回答内容',
        formData: [
          {
            formFieldId: 'field1',
            value: 'テキスト回答',
          },
          {
            formFieldId: 'field2',
            value: 'オプション1',
          },
        ],
      };
      const request = createMockRequest(requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(201);
      expect(data.id).toBe('answer1');
      expect(data.formData).toHaveLength(2);
      expect(data.formData[0].value).toBe('テキスト回答');
      expect(data.formData[1].value).toBe('オプション1');
    });

    it('割り当てられていないユーザーが回答を作成しようとすると403を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockUser);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);

      // リクエスト実行
      const requestBody = {
        content: 'テスト回答内容',
      };
      const request = createMockRequest(requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('クローズされた質問には回答できないこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAssignee);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockClosedQuestion as any);

      // リクエスト実行
      const requestBody = {
        content: 'テスト回答内容',
      };
      const request = createMockRequest(requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'question2' } });
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

      // リクエスト実行
      const requestBody = {
        content: '', // 空の内容（バリデーションエラー）
      };
      const request = createMockRequest(requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('存在しないメディアファイルIDを指定すると400を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAssignee);

      // validateRequestのモック
      jest.spyOn(apiUtils, 'validateRequest').mockResolvedValue({
        success: true,
        data: {
          content: 'テスト回答内容',
          mediaFileIds: ['nonexistent'],
        },
      });

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion as any);
      prismaMock.mediaFile.findMany.mockResolvedValue([]); // ファイルが見つからない

      // リクエスト実行
      const requestBody = {
        content: 'テスト回答内容',
        mediaFileIds: ['nonexistent'],
      };
      const request = createMockRequest(requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'question1' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('質問が見つからない場合は404を返すこと', async () => {
      // getUserFromRequestのモック
      jest.spyOn(apiUtils, 'getUserFromRequest').mockReturnValue(mockAssignee);

      // Prismaモック
      prismaMock.question.findUnique.mockResolvedValue(null);

      // リクエスト実行
      const requestBody = {
        content: 'テスト回答内容',
      };
      const request = createMockRequest(requestBody);
      const response = await POST(request, { params: { projectId: 'project1', questionId: 'nonexistent' } });
      const data = await response.json();

      // レスポンス検証
      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });
}); 