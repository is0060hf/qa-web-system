import { z } from 'zod';
import { ProjectRole } from '@prisma/client';

// プロジェクト作成スキーマ
export const createProjectSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
});

// プロジェクト更新スキーマ
export const updateProjectSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください').optional(),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
});

// プロジェクトメンバー追加スキーマ
export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, 'ユーザーIDは必須です'),
  role: z.nativeEnum(ProjectRole, {
    errorMap: () => ({ message: 'ロールは MANAGER または MEMBER のいずれかを指定してください' }),
  }),
});

// プロジェクトメンバーロール更新スキーマ
export const updateProjectMemberRoleSchema = z.object({
  role: z.nativeEnum(ProjectRole, {
    errorMap: () => ({ message: 'ロールは MANAGER または MEMBER のいずれかを指定してください' }),
  }),
});

// プロジェクトタグ作成スキーマ
export const createProjectTagSchema = z.object({
  name: z.string().min(1, 'タグ名は必須です').max(50, 'タグ名は50文字以内で入力してください'),
});

// プロジェクト招待スキーマ
export const inviteToProjectSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    email: z.string().email('有効なメールアドレスを入力してください'),
  }),
  z.object({
    type: z.literal('userId'),
    userId: z.string().min(1, 'ユーザーIDは必須です'),
  }),
]);

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateProjectMemberRoleInput = z.infer<typeof updateProjectMemberRoleSchema>;
export type CreateProjectTagInput = z.infer<typeof createProjectTagSchema>;
export type InviteToProjectInput = z.infer<typeof inviteToProjectSchema>; 