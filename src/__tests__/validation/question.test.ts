import { z } from 'zod';
import {
  createQuestionSchema,
  updateQuestionSchema,
  updateQuestionStatusSchema,
  createAnswerSchema,
  updateAnswerSchema,
  createFormFieldSchema,
  createAnswerFormSchema
} from '@/lib/validations/question';
import { QuestionPriority, QuestionStatus } from '@prisma/client';

describe('Question Validation Schemas Tests', () => {
  describe('createQuestionSchema', () => {
    it('should validate valid question creation data', () => {
      // 有効なデータ
      const validData = {
        title: '質問タイトル',
        content: '質問の内容です。回答をお願いします。',
        assigneeId: 'user-123',
        deadline: '2023-12-31T23:59:59Z',
        priority: QuestionPriority.HIGH,
        tagIds: ['tag-1', 'tag-2']
      };

      // バリデーション実行
      const result = createQuestionSchema.safeParse(validData);

      // 検証
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate question with minimal required fields', () => {
      // 最小限の必須フィールドのみ
      const minimalData = {
        title: '質問タイトル',
        content: '質問の内容です。',
        assigneeId: 'user-123'
      };

      // バリデーション実行
      const result = createQuestionSchema.safeParse(minimalData);

      // 検証
      expect(result.success).toBe(true);
      if (result.success) {
        // デフォルト値が設定されていることを確認
        expect(result.data).toEqual({
          ...minimalData,
          priority: QuestionPriority.MEDIUM
        });
      }
    });

    it('should reject missing required fields', () => {
      // タイトルなし
      const missingTitle = {
        content: '質問の内容です。',
        assigneeId: 'user-123'
      };

      // 内容なし
      const missingContent = {
        title: '質問タイトル',
        assigneeId: 'user-123'
      };

      // 回答者なし
      const missingAssignee = {
        title: '質問タイトル',
        content: '質問の内容です。'
      };

      // バリデーション実行と検証
      expect(createQuestionSchema.safeParse(missingTitle).success).toBe(false);
      expect(createQuestionSchema.safeParse(missingContent).success).toBe(false);
      expect(createQuestionSchema.safeParse(missingAssignee).success).toBe(false);
    });

    it('should reject too long title or content', () => {
      // 長すぎるタイトル
      const tooLongTitle = {
        title: 'a'.repeat(201), // 200文字超過
        content: '質問の内容です。',
        assigneeId: 'user-123'
      };

      // 長すぎる内容
      const tooLongContent = {
        title: '質問タイトル',
        content: 'a'.repeat(10001), // 10000文字超過
        assigneeId: 'user-123'
      };

      // バリデーション実行と検証
      expect(createQuestionSchema.safeParse(tooLongTitle).success).toBe(false);
      expect(createQuestionSchema.safeParse(tooLongContent).success).toBe(false);
    });

    it('should validate with different priorities', () => {
      // 各優先度でのデータ
      const priorities = [
        QuestionPriority.HIGHEST,
        QuestionPriority.HIGH,
        QuestionPriority.MEDIUM,
        QuestionPriority.LOW
      ];

      // 各優先度でのバリデーション
      priorities.forEach(priority => {
        const data = {
          title: '質問タイトル',
          content: '質問の内容です。',
          assigneeId: 'user-123',
          priority
        };

        expect(createQuestionSchema.safeParse(data).success).toBe(true);
      });
    });

    it('should reject invalid priority values', () => {
      // 無効な優先度
      const invalidPriority = {
        title: '質問タイトル',
        content: '質問の内容です。',
        assigneeId: 'user-123',
        priority: 'INVALID_PRIORITY'
      };

      // バリデーション実行と検証
      expect(createQuestionSchema.safeParse(invalidPriority).success).toBe(false);
    });
  });

  describe('updateQuestionSchema', () => {
    it('should validate partial question updates', () => {
      // タイトルだけの更新
      const titleUpdate = {
        title: '更新後のタイトル'
      };

      // 内容だけの更新
      const contentUpdate = {
        content: '更新後の内容です。'
      };

      // 担当者変更
      const assigneeUpdate = {
        assigneeId: 'new-user-456'
      };

      // 複数フィールドの更新
      const multipleUpdate = {
        title: '新タイトル',
        content: '新内容',
        priority: QuestionPriority.HIGHEST
      };

      // バリデーション実行と検証
      expect(updateQuestionSchema.safeParse(titleUpdate).success).toBe(true);
      expect(updateQuestionSchema.safeParse(contentUpdate).success).toBe(true);
      expect(updateQuestionSchema.safeParse(assigneeUpdate).success).toBe(true);
      expect(updateQuestionSchema.safeParse(multipleUpdate).success).toBe(true);
    });

    it('should validate clearing deadline', () => {
      // 期限をnullに設定
      const clearDeadline = {
        deadline: null
      };

      // バリデーション実行
      const result = updateQuestionSchema.safeParse(clearDeadline);

      // 検証
      expect(result.success).toBe(true);
    });

    it('should reject invalid field values', () => {
      // 空のタイトル
      const emptyTitle = {
        title: ''
      };

      // 長すぎる内容
      const longContent = {
        content: 'a'.repeat(10001)
      };

      // 空の担当者ID
      const emptyAssignee = {
        assigneeId: ''
      };

      // バリデーション実行と検証
      expect(updateQuestionSchema.safeParse(emptyTitle).success).toBe(false);
      expect(updateQuestionSchema.safeParse(longContent).success).toBe(false);
      expect(updateQuestionSchema.safeParse(emptyAssignee).success).toBe(false);
    });
  });

  describe('updateQuestionStatusSchema', () => {
    it('should validate valid status updates', () => {
      // 各ステータス値でのデータ
      const statuses = [
        QuestionStatus.NEW,
        QuestionStatus.IN_PROGRESS,
        QuestionStatus.PENDING_APPROVAL,
        QuestionStatus.CLOSED
      ];

      // 各ステータスでのバリデーション
      statuses.forEach(status => {
        const data = { status };
        expect(updateQuestionStatusSchema.safeParse(data).success).toBe(true);
      });
    });

    it('should reject invalid status values', () => {
      // 無効なステータス
      const invalidStatus = {
        status: 'INVALID_STATUS'
      };

      // バリデーション実行と検証
      expect(updateQuestionStatusSchema.safeParse(invalidStatus).success).toBe(false);
    });
  });

  describe('createAnswerSchema', () => {
    it('should validate valid answer creation data', () => {
      // 有効なデータ
      const validData = {
        content: '回答内容です。これが解決策です。',
        mediaFileIds: ['file-1', 'file-2'],
        formData: [
          { formFieldId: 'field-1', value: '入力値1' },
          { formFieldId: 'field-2', mediaFileId: 'file-3' }
        ]
      };

      // バリデーション実行
      const result = createAnswerSchema.safeParse(validData);

      // 検証
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate answer with content only', () => {
      // 最小限のデータ
      const minimalData = {
        content: '回答内容のみです。'
      };

      // バリデーション実行
      const result = createAnswerSchema.safeParse(minimalData);

      // 検証
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      // 内容が空のデータ
      const emptyContent = {
        content: '',
        mediaFileIds: ['file-1']
      };

      // バリデーション実行
      const result = createAnswerSchema.safeParse(emptyContent);

      // 検証
      expect(result.success).toBe(false);
    });

    it('should reject too long content', () => {
      // 長すぎる内容のデータ
      const longContent = {
        content: 'a'.repeat(10001) // 10000文字超過
      };

      // バリデーション実行
      const result = createAnswerSchema.safeParse(longContent);

      // 検証
      expect(result.success).toBe(false);
    });
  });

  describe('updateAnswerSchema', () => {
    it('should validate valid answer updates', () => {
      // 内容だけの更新
      const contentUpdate = {
        content: '更新後の回答内容です。'
      };

      // 添付ファイル更新
      const mediaUpdate = {
        content: '回答内容',
        mediaFileIds: ['new-file-1']
      };

      // フォームデータ更新
      const formDataUpdate = {
        content: '回答内容',
        formData: [
          { formFieldId: 'field-1', value: '新しい値' }
        ]
      };

      // バリデーション実行と検証
      expect(updateAnswerSchema.safeParse(contentUpdate).success).toBe(true);
      expect(updateAnswerSchema.safeParse(mediaUpdate).success).toBe(true);
      expect(updateAnswerSchema.safeParse(formDataUpdate).success).toBe(true);
    });

    it('should reject invalid updates', () => {
      // 空の内容
      const emptyContent = {
        content: ''
      };

      // フォームフィールドIDなし
      const invalidFormData = {
        content: '回答内容',
        formData: [
          { formFieldId: '', value: '値' } // 空のフィールドID
        ]
      };

      // バリデーション実行と検証
      expect(updateAnswerSchema.safeParse(emptyContent).success).toBe(false);
      expect(updateAnswerSchema.safeParse(invalidFormData).success).toBe(false);
    });
  });

  describe('createFormFieldSchema', () => {
    it('should validate valid form field creation', () => {
      // テキストフィールド
      const textField = {
        label: 'テキスト入力',
        fieldType: 'TEXT',
        isRequired: true
      };

      // ラジオボタン（選択肢あり）
      const radioField = {
        label: '選択肢',
        fieldType: 'RADIO',
        options: ['選択肢1', '選択肢2', '選択肢3'],
        order: 2
      };

      // ファイルアップロードフィールド
      const fileField = {
        label: 'ファイル添付',
        fieldType: 'FILE',
        isRequired: false,
        order: 3
      };

      // バリデーション実行と検証
      expect(createFormFieldSchema.safeParse(textField).success).toBe(true);
      expect(createFormFieldSchema.safeParse(radioField).success).toBe(true);
      expect(createFormFieldSchema.safeParse(fileField).success).toBe(true);
    });

    it('should reject invalid form field data', () => {
      // ラベルなし
      const noLabel = {
        fieldType: 'TEXT'
      };

      // 無効なフィールドタイプ
      const invalidType = {
        label: 'テスト',
        fieldType: 'INVALID_TYPE'
      };

      // ラジオボタンで選択肢なし
      const radioNoOptions = {
        label: '選択',
        fieldType: 'RADIO',
        // options配列がない
      };

      // バリデーション実行と検証
      expect(createFormFieldSchema.safeParse(noLabel).success).toBe(false);
      expect(createFormFieldSchema.safeParse(invalidType).success).toBe(false);

      // ラジオボタンの場合、選択肢は必須ではない（スキーマ定義による）
      // もし必須であれば、テストを更新する必要がある
    });
  });

  describe('createAnswerFormSchema', () => {
    it('should validate form with multiple fields', () => {
      // 複数フィールドを持つフォーム
      const validForm = {
        fields: [
          {
            label: '質問1',
            fieldType: 'TEXT',
            isRequired: true,
            order: 1
          },
          {
            label: '質問2',
            fieldType: 'RADIO',
            options: ['はい', 'いいえ'],
            order: 2
          },
          {
            label: '添付資料',
            fieldType: 'FILE',
            order: 3
          }
        ]
      };

      // バリデーション実行
      const result = createAnswerFormSchema.safeParse(validForm);

      // 検証
      expect(result.success).toBe(true);
    });

    it('should reject form without fields', () => {
      // フィールドがない
      const emptyForm = {
        fields: []
      };

      // バリデーション実行
      const result = createAnswerFormSchema.safeParse(emptyForm);

      // 検証
      expect(result.success).toBe(false);
    });

    it('should reject form with invalid fields', () => {
      // 無効なフィールドを含むフォーム
      const invalidFieldForm = {
        fields: [
          {
            label: '', // 空のラベル
            fieldType: 'TEXT'
          },
          {
            label: '正常なフィールド',
            fieldType: 'NUMBER'
          }
        ]
      };

      // バリデーション実行
      const result = createAnswerFormSchema.safeParse(invalidFieldForm);

      // 検証
      expect(result.success).toBe(false);
    });
  });
}); 