import { z } from 'zod';
import { QuestionPriority, QuestionStatus } from '@prisma/client';

// フォームフィールドのスキーマ
const formFieldSchema = z.object({
  id: z.string().optional(), // フロントエンドで生成されるIDは無視
  label: z.string().min(1, 'ラベルは必須です').max(100, 'ラベルは100文字以内で入力してください'),
  fieldType: z.enum(['TEXT', 'NUMBER', 'RADIO', 'FILE', 'TEXTAREA']),
  options: z.array(z.string()).optional(), // RADIOタイプの場合の選択肢
  isRequired: z.boolean().optional().default(false),
  order: z.number().int().optional(),
});

// 回答フォームのスキーマ
const answerFormSchema = z.object({
  fields: z.array(formFieldSchema).min(1, '少なくとも1つのフィールドが必要です'),
});

// 質問作成スキーマ
export const createQuestionSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  content: z.string().min(1, '内容は必須です').max(10000, '内容は10000文字以内で入力してください'),
  assigneeId: z.string().min(1, '回答者は必須です'),
  deadline: z.string().optional().nullable(), // ISO 8601 形式の日付文字列
  priority: z.nativeEnum(QuestionPriority, {
    errorMap: () => ({ message: '優先度は HIGHEST, HIGH, MEDIUM, LOW のいずれかを指定してください' }),
  }).optional().default(QuestionPriority.MEDIUM),
  tagIds: z.array(z.string()).optional(),
  // 回答フォーム関連フィールドを追加（null値を許可）
  answerForm: answerFormSchema.optional().nullable(),
  answerFormTemplateId: z.string().optional().nullable(),
  saveAsTemplate: z.boolean().optional().default(false),
  templateName: z.string().optional().nullable(),
}).passthrough(); // 未定義のフィールドを許可（フロントエンドの余分なフィールドを無視）

// 質問更新スキーマ
export const updateQuestionSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください').optional(),
  content: z.string().min(1, '内容は必須です').max(10000, '内容は10000文字以内で入力してください').optional(),
  assigneeId: z.string().min(1, '回答者は必須です').optional(),
  deadline: z.string().optional().nullable(), // ISO 8601 形式の日付文字列、nullを許可
  priority: z.nativeEnum(QuestionPriority, {
    errorMap: () => ({ message: '優先度は HIGHEST, HIGH, MEDIUM, LOW のいずれかを指定してください' }),
  }).optional(),
  tagIds: z.array(z.string()).optional(),
});

// 質問ステータス更新スキーマ
export const updateQuestionStatusSchema = z.object({
  status: z.nativeEnum(QuestionStatus, {
    errorMap: () => ({ message: 'ステータスは NEW, IN_PROGRESS, PENDING_APPROVAL, CLOSED のいずれかを指定してください' }),
  }),
});

// 回答作成スキーマ
export const createAnswerSchema = z.object({
  content: z.string().min(1, '回答内容は必須です').max(10000, '回答内容は10000文字以内で入力してください'),
  mediaFileIds: z.array(z.string()).optional(), // 添付ファイルIDs
  formData: z.array(
    z.object({
      formFieldId: z.string(),
      value: z.string().optional(),
      mediaFileId: z.string().optional(),
    })
  ).optional(), // フォームデータ
});

// 回答更新スキーマ
export const updateAnswerSchema = z.object({
  content: z.string().min(1, '回答内容は必須です').max(10000, '回答内容は10000文字以内で入力してください'),
  mediaFileIds: z.array(z.string()).optional(), // 添付ファイルIDs
  formData: z.array(
    z.object({
      formFieldId: z.string(),
      value: z.string().optional(),
      mediaFileId: z.string().optional(),
    })
  ).optional(), // フォームデータ
});

// 回答フォームフィールド作成スキーマ
export const createFormFieldSchema = z.object({
  label: z.string().min(1, 'ラベルは必須です').max(100, 'ラベルは100文字以内で入力してください'),
  fieldType: z.enum(['TEXT', 'NUMBER', 'RADIO', 'FILE', 'TEXTAREA']),
  options: z.array(z.string()).optional(), // RADIOタイプの場合の選択肢
  isRequired: z.boolean().optional().default(false),
  order: z.number().int().optional(),
});

// 回答フォーム作成スキーマ
export const createAnswerFormSchema = z.object({
  fields: z.array(createFormFieldSchema).min(1, '少なくとも1つのフィールドが必要です'),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type UpdateQuestionStatusInput = z.infer<typeof updateQuestionStatusSchema>;
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
export type UpdateAnswerInput = z.infer<typeof updateAnswerSchema>;
export type CreateFormFieldInput = z.infer<typeof createFormFieldSchema>;
export type CreateAnswerFormInput = z.infer<typeof createAnswerFormSchema>; 