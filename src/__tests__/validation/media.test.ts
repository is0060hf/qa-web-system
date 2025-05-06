import { z } from 'zod';
import { getUploadUrlSchema, createMediaFileSchema } from '@/lib/validations/media';

describe('Media Validation Schemas Tests', () => {
  describe('getUploadUrlSchema', () => {
    it('should validate valid upload URL request data', () => {
      // 有効なデータ
      const validData = {
        fileName: 'test-document.pdf',
        contentType: 'application/pdf',
        directory: 'uploads/documents',
      };

      // バリデーション実行
      const result = getUploadUrlSchema.safeParse(validData);

      // 検証
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate minimal required fields', () => {
      // 最小限の必須フィールドのみのデータ
      const minimalData = {
        fileName: 'image.jpg',
        contentType: 'image/jpeg',
        // directoryはオプション
      };

      // バリデーション実行
      const result = getUploadUrlSchema.safeParse(minimalData);

      // 検証
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(minimalData);
      }
    });

    it('should reject missing required fields', () => {
      // fileNameが不足
      const missingFileName = {
        contentType: 'image/jpeg',
        directory: 'uploads/images',
      };

      // バリデーション実行
      const result1 = getUploadUrlSchema.safeParse(missingFileName);
      expect(result1.success).toBe(false);
      
      // contentTypeが不足
      const missingContentType = {
        fileName: 'image.jpg',
        directory: 'uploads/images',
      };

      // バリデーション実行
      const result2 = getUploadUrlSchema.safeParse(missingContentType);
      expect(result2.success).toBe(false);
    });

    it('should reject invalid file names', () => {
      // 空のファイル名
      const emptyFileName = {
        fileName: '',
        contentType: 'image/jpeg',
      };

      // バリデーション実行
      const result1 = getUploadUrlSchema.safeParse(emptyFileName);
      expect(result1.success).toBe(false);

      // 長すぎるファイル名
      const tooLongFileName = {
        fileName: 'a'.repeat(256) + '.jpg', // 255文字超過
        contentType: 'image/jpeg',
      };

      // バリデーション実行
      const result2 = getUploadUrlSchema.safeParse(tooLongFileName);
      expect(result2.success).toBe(false);
    });

    it('should validate different content types', () => {
      // 一般的なコンテンツタイプの検証
      const contentTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'audio/mpeg',
        'video/mp4',
      ];

      // 各コンテンツタイプのバリデーション
      contentTypes.forEach(contentType => {
        const data = {
          fileName: 'test-file.xyz',
          contentType,
        };

        const result = getUploadUrlSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate directory path length and format', () => {
      // 長すぎるディレクトリパス
      const tooLongDirectory = {
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        directory: 'a'.repeat(256), // 255文字超過
      };

      // バリデーション実行
      const result1 = getUploadUrlSchema.safeParse(tooLongDirectory);
      expect(result1.success).toBe(false);

      // 無効な文字を含むパス
      const invalidPathChars = {
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        directory: '../uploads/bypass', // パストラバーサル攻撃
      };

      // バリデーション実行
      const result2 = getUploadUrlSchema.safeParse(invalidPathChars);
      expect(result2.success).toBe(false);
    });
  });

  describe('createMediaFileSchema', () => {
    it('should validate valid media file creation data', () => {
      // 有効なデータ
      const validData = {
        fileName: 'document.pdf',
        fileSize: 12345,
        fileType: 'application/pdf',
        storageUrl: 'https://example.com/blobs/document.pdf',
      };

      // バリデーション実行
      const result = createMediaFileSchema.safeParse(validData);

      // 検証
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject missing required fields', () => {
      // ファイル名が不足
      const missingFileName = {
        fileSize: 12345,
        fileType: 'application/pdf',
        storageUrl: 'https://example.com/blobs/document.pdf',
      };

      // バリデーション実行
      const result1 = createMediaFileSchema.safeParse(missingFileName);
      expect(result1.success).toBe(false);

      // ファイルサイズが不足
      const missingFileSize = {
        fileName: 'document.pdf',
        fileType: 'application/pdf',
        storageUrl: 'https://example.com/blobs/document.pdf',
      };

      // バリデーション実行
      const result2 = createMediaFileSchema.safeParse(missingFileSize);
      expect(result2.success).toBe(false);

      // ファイルタイプが不足
      const missingFileType = {
        fileName: 'document.pdf',
        fileSize: 12345,
        storageUrl: 'https://example.com/blobs/document.pdf',
      };

      // バリデーション実行
      const result3 = createMediaFileSchema.safeParse(missingFileType);
      expect(result3.success).toBe(false);

      // ストレージURLが不足
      const missingStorageUrl = {
        fileName: 'document.pdf',
        fileSize: 12345,
        fileType: 'application/pdf',
      };

      // バリデーション実行
      const result4 = createMediaFileSchema.safeParse(missingStorageUrl);
      expect(result4.success).toBe(false);
    });

    it('should validate file size is positive', () => {
      // 負のファイルサイズ
      const negativeFileSize = {
        fileName: 'document.pdf',
        fileSize: -100,
        fileType: 'application/pdf',
        storageUrl: 'https://example.com/blobs/document.pdf',
      };

      // バリデーション実行
      const result1 = createMediaFileSchema.safeParse(negativeFileSize);
      expect(result1.success).toBe(false);

      // ゼロのファイルサイズ
      const zeroFileSize = {
        fileName: 'document.pdf',
        fileSize: 0,
        fileType: 'application/pdf',
        storageUrl: 'https://example.com/blobs/document.pdf',
      };

      // バリデーション実行
      const result2 = createMediaFileSchema.safeParse(zeroFileSize);
      expect(result2.success).toBe(false);
    });

    it('should validate storageUrl format', () => {
      // 無効なURL形式
      const invalidUrl = {
        fileName: 'document.pdf',
        fileSize: 12345,
        fileType: 'application/pdf',
        storageUrl: 'not-a-url',
      };

      // バリデーション実行
      const result = createMediaFileSchema.safeParse(invalidUrl);
      expect(result.success).toBe(false);
    });

    it('should validate extremely large files', () => {
      // 非常に大きなファイル（5GBを超える）
      const hugeFile = {
        fileName: 'huge-video.mp4',
        fileSize: 5 * 1024 * 1024 * 1024 + 1, // 5GB + 1バイト
        fileType: 'video/mp4',
        storageUrl: 'https://example.com/blobs/huge-video.mp4',
      };

      // バリデーション実行
      const result = createMediaFileSchema.safeParse(hugeFile);
      
      // 検証（ファイルサイズの上限が設定されていれば失敗、なければ成功）
      if (createMediaFileSchema.shape.fileSize instanceof z.ZodNumber && 
          createMediaFileSchema.shape.fileSize._def.checks.some(
            (check: any) => check.kind === 'max'
          )) {
        expect(result.success).toBe(false);
      } else {
        // 上限が設定されていない場合は成功
        expect(result.success).toBe(true);
      }
    });
  });
}); 