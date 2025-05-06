import { z } from 'zod';

// メディアファイル情報登録スキーマ
export const createMediaFileSchema = z.object({
  fileName: z.string().min(1, 'ファイル名は必須です').max(255, 'ファイル名は255文字以内で入力してください'),
  fileSize: z.number().int().positive('ファイルサイズは正の整数である必要があります'),
  fileType: z.string().min(1, 'ファイルタイプは必須です'),
  storageUrl: z.string().url('有効なURLを入力してください'),
});

// メディアファイルアップロード用署名付きURL生成スキーマ
export const getUploadUrlSchema = z.object({
  fileName: z.string().min(1, 'ファイル名は必須です').max(255, 'ファイル名は255文字以内で入力してください'),
  contentType: z.string().min(1, 'コンテンツタイプは必須です'),
  directory: z.string().optional(),
});

export type CreateMediaFileInput = z.infer<typeof createMediaFileSchema>;
export type GetUploadUrlInput = z.infer<typeof getUploadUrlSchema>; 