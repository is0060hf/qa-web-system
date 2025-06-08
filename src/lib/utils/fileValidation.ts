import { getMimeType } from './blob';

// 許可されるファイルタイプの定義
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  videos: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
} as const;

// 全ての許可されるファイルタイプ
export const ALL_ALLOWED_FILE_TYPES = [
  ...ALLOWED_FILE_TYPES.images,
  ...ALLOWED_FILE_TYPES.documents,
  ...ALLOWED_FILE_TYPES.videos,
  ...ALLOWED_FILE_TYPES.audio,
];

// ファイルサイズ制限
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  document: 50 * 1024 * 1024, // 50MB
  video: 500 * 1024 * 1024, // 500MB
  audio: 100 * 1024 * 1024, // 100MB
  default: 100 * 1024 * 1024, // 100MB
};

// ファイル名のサニタイゼーション
export function sanitizeFileName(fileName: string): string {
  // 危険な文字を除去
  let sanitized = fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  
  // パストラバーサル攻撃の防止
  sanitized = sanitized.replace(/\.\./g, '_');
  sanitized = sanitized.replace(/^\./, '_');
  
  // 最大長を制限（拡張子を保持）
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const extension = sanitized.split('.').pop() || '';
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    const maxNameLength = maxLength - extension.length - 1;
    sanitized = nameWithoutExt.substring(0, maxNameLength) + '.' + extension;
  }
  
  // 空文字列の場合はデフォルト名を使用
  if (!sanitized || sanitized.trim() === '') {
    sanitized = 'untitled';
  }
  
  return sanitized;
}

// ファイルタイプのカテゴリを取得
export function getFileCategory(mimeType: string): 'image' | 'document' | 'video' | 'audio' | 'other' {
  if (ALLOWED_FILE_TYPES.images.includes(mimeType as any)) return 'image';
  if (ALLOWED_FILE_TYPES.documents.includes(mimeType as any)) return 'document';
  if (ALLOWED_FILE_TYPES.videos.includes(mimeType as any)) return 'video';
  if (ALLOWED_FILE_TYPES.audio.includes(mimeType as any)) return 'audio';
  return 'other';
}

// ファイルサイズ制限を取得
export function getFileSizeLimit(mimeType: string): number {
  const category = getFileCategory(mimeType);
  if (category === 'other') {
    return FILE_SIZE_LIMITS.default;
  }
  return FILE_SIZE_LIMITS[category];
}

// ファイルバリデーション結果の型
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFileName?: string;
}

// ファイルのバリデーション
export async function validateFile(
  file: File | { name: string; type: string; size: number },
  options: {
    allowedTypes?: string[];
    maxSize?: number;
    checkContent?: boolean;
    skipSizeCheck?: boolean;
  } = {}
): Promise<FileValidationResult> {
  const {
    allowedTypes = ALL_ALLOWED_FILE_TYPES,
    maxSize,
    checkContent = true,
    skipSizeCheck = false,
  } = options;
  
  // ファイル名のサニタイゼーション
  const sanitizedFileName = sanitizeFileName(file.name);

  // ファイルタイプの検証
  if (!allowedTypes.includes(file.type)) {
    // ファイル拡張子からMIMEタイプを推測
    const guessedType = getMimeType(file.name);
    if (!allowedTypes.includes(guessedType)) {
      return {
        isValid: false,
        error: `許可されていないファイルタイプです: ${file.type}`,
      };
    }
  }

  // ファイルサイズの検証
  if (!skipSizeCheck) {
    const maxSizeValue = maxSize ?? getFileSizeLimit(file.type);
    if (file.size > maxSizeValue) {
      const maxSizeMB = Math.round(maxSizeValue / (1024 * 1024));
      return {
        isValid: false,
        error: `ファイルサイズが大きすぎます（最大${maxSizeMB}MB）`,
      };
    }
  }

  // ファイル内容の検証（File APIが利用可能な場合のみ）
  if (checkContent && file instanceof File) {
    try {
      const isContentValid = await validateFileContent(file);
      if (!isContentValid) {
        return {
          isValid: false,
          error: 'ファイルの内容が無効または危険です',
        };
      }
    } catch (error) {
      console.error('ファイル内容の検証エラー:', error);
      // 検証エラーの場合は安全側に倒す
      return {
        isValid: false,
        error: 'ファイルの検証中にエラーが発生しました',
      };
    }
  }

  return {
    isValid: true,
    sanitizedFileName,
  };
}

// ファイル内容の詳細な検証
async function validateFileContent(file: File): Promise<boolean> {
  // 画像ファイルの場合、実際に画像として読み込めるか確認
  if (file.type.startsWith('image/')) {
    return await validateImageContent(file);
  }
  
  // その他のファイルタイプの場合は、マジックナンバーをチェック
  return await validateFileMagicNumber(file);
}

// 画像ファイルの内容検証
async function validateImageContent(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    let timeout: ReturnType<typeof setTimeout>;
    
    const cleanup = () => {
      URL.revokeObjectURL(url);
      clearTimeout(timeout);
    };
    
    img.onload = () => {
      cleanup();
      resolve(true);
    };
    
    img.onerror = () => {
      cleanup();
      resolve(false);
    };
    
    // 10秒でタイムアウト
    timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 10000);
    
    img.src = url;
  });
}

// ファイルのマジックナンバー検証
async function validateFileMagicNumber(file: File): Promise<boolean> {
  // ファイルの先頭バイトを読み取る
  const buffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // ファイルタイプごとのマジックナンバー
  const magicNumbers: Record<string, number[][]> = {
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a, GIF89a
  };
  
  const expectedMagicNumbers = magicNumbers[file.type];
  if (!expectedMagicNumbers) {
    // マジックナンバーが定義されていないファイルタイプは許可
    return true;
  }
  
  // マジックナンバーの照合
  return expectedMagicNumbers.some(magic => 
    magic.every((byte, index) => bytes[index] === byte)
  );
} 