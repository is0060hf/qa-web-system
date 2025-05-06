import { PutBlobResult, del, list, put } from '@vercel/blob';

/**
 * ファイルをVercel Blobにアップロード
 * @param file アップロードするファイル
 * @param options アップロードオプション
 * @returns アップロード結果
 */
export async function uploadFile(
  file: File,
  options?: {
    access?: 'public';
    directory?: string;
    addRandomSuffix?: boolean;
  }
): Promise<PutBlobResult> {
  const access = options?.access || 'public';
  const filename = options?.addRandomSuffix 
    ? `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${file.name}`
    : file.name;
  
  const path = options?.directory 
    ? `${options.directory}/${filename}` 
    : filename;

  return await put(path, file, { access });
}

/**
 * Vercel Blobからファイルを削除
 * @param url 削除するファイルのURL
 * @returns 削除成功時はtrue
 */
export async function deleteFile(url: string): Promise<boolean> {
  try {
    await del(url);
    return true;
  } catch (error) {
    console.error('ファイル削除エラー:', error);
    return false;
  }
}

/**
 * ディレクトリ内のファイル一覧を取得
 * @param directory ディレクトリパス
 * @returns ファイル一覧
 */
export async function listFiles(directory?: string) {
  const options = directory ? { prefix: directory } : undefined;
  return await list(options);
}

/**
 * ファイル名から適切なMIMEタイプを推測
 * @param filename ファイル名
 * @returns MIMEタイプ
 */
export function getMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    // 画像
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    // 文書
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    // その他
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
  };

  return mimeTypes[extension] || 'application/octet-stream';
} 