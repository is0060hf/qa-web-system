import { uploadFile, deleteFile, listFiles, getMimeType } from '@/lib/utils/blob';
import { put, del, list } from '@vercel/blob';

// @vercel/blobモジュールをモック化
jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  del: jest.fn(),
  list: jest.fn(),
}));

describe('Blob Storage Utilities Tests', () => {
  // 各テスト後にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a file with default options', async () => {
      // モックFile
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      
      // モックレスポンス
      const mockResponse = {
        url: 'https://test-blob-storage.vercel.app/test.pdf',
        pathname: 'test.pdf',
        contentType: 'application/pdf',
        size: 12,
      };
      
      // putモックの実装
      (put as jest.Mock).mockResolvedValue(mockResponse);
      
      // ファイルアップロード
      const result = await uploadFile(mockFile);
      
      // put関数が正しく呼ばれたことを確認
      expect(put).toHaveBeenCalledWith('test.pdf', mockFile, { access: 'public' });
      
      // 期待する結果が返されることを確認
      expect(result).toEqual(mockResponse);
    });

    it('should upload a file with directory and random suffix', async () => {
      // モックFile
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      
      // モックレスポンス
      const mockResponse = {
        url: 'https://test-blob-storage.vercel.app/images/test-random.jpg',
        pathname: 'images/test-random.jpg',
        contentType: 'image/jpeg',
        size: 12,
      };
      
      // 日付とランダム関数のモック
      const originalDateNow = Date.now;
      const originalMathRandom = Math.random;
      Date.now = jest.fn().mockReturnValue(1234567890);
      Math.random = jest.fn().mockReturnValue(0.123456789);
      
      // putモックの実装
      (put as jest.Mock).mockResolvedValue(mockResponse);
      
      // ファイルアップロード（ディレクトリとランダムサフィックス指定）
      const result = await uploadFile(mockFile, {
        directory: 'images',
        addRandomSuffix: true,
      });
      
      // ランダム値を含む期待されるパスを生成
      const expectedPath = `images/1234567890-0gfvjtwilp-test.jpg`;
      
      // put関数が正しく呼ばれたことを確認
      expect(put).toHaveBeenCalledWith(expectedPath, mockFile, { access: 'public' });
      
      // 期待する結果が返されることを確認
      expect(result).toEqual(mockResponse);
      
      // 元の関数を戻す
      Date.now = originalDateNow;
      Math.random = originalMathRandom;
    });
  });

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      // delモックの実装
      (del as jest.Mock).mockResolvedValue({ success: true });
      
      // ファイル削除
      const testUrl = 'https://test-blob-storage.vercel.app/test.pdf';
      const result = await deleteFile(testUrl);
      
      // del関数が正しく呼ばれたことを確認
      expect(del).toHaveBeenCalledWith(testUrl);
      
      // 削除成功を確認
      expect(result).toBe(true);
    });

    it('should handle errors during file deletion', async () => {
      // エラーを投げるdelモック
      (del as jest.Mock).mockRejectedValue(new Error('Deletion failed'));
      
      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // ファイル削除
      const testUrl = 'https://test-blob-storage.vercel.app/error.pdf';
      const result = await deleteFile(testUrl);
      
      // del関数が正しく呼ばれたことを確認
      expect(del).toHaveBeenCalledWith(testUrl);
      
      // 削除失敗を確認
      expect(result).toBe(false);
      
      // エラーログが出力されていることを確認
      expect(consoleSpy).toHaveBeenCalled();
      
      // モックを復元
      consoleSpy.mockRestore();
    });
  });

  describe('listFiles', () => {
    it('should list files without directory specified', async () => {
      // モックレスポンス
      const mockResponse = {
        blobs: [
          {
            url: 'https://test-blob-storage.vercel.app/test1.pdf',
            pathname: 'test1.pdf',
            contentType: 'application/pdf',
            size: 12345,
          },
          {
            url: 'https://test-blob-storage.vercel.app/test2.jpg',
            pathname: 'test2.jpg',
            contentType: 'image/jpeg',
            size: 54321,
          },
        ],
        cursor: null,
      };
      
      // listモックの実装
      (list as jest.Mock).mockResolvedValue(mockResponse);
      
      // ファイル一覧取得
      const result = await listFiles();
      
      // list関数が正しく呼ばれたことを確認
      expect(list).toHaveBeenCalledWith(undefined);
      
      // 期待する結果が返されることを確認
      expect(result).toEqual(mockResponse);
    });

    it('should list files with directory specified', async () => {
      // モックレスポンス
      const mockResponse = {
        blobs: [
          {
            url: 'https://test-blob-storage.vercel.app/images/photo1.jpg',
            pathname: 'images/photo1.jpg',
            contentType: 'image/jpeg',
            size: 12345,
          },
          {
            url: 'https://test-blob-storage.vercel.app/images/photo2.png',
            pathname: 'images/photo2.png',
            contentType: 'image/png',
            size: 54321,
          },
        ],
        cursor: null,
      };
      
      // listモックの実装
      (list as jest.Mock).mockResolvedValue(mockResponse);
      
      // ディレクトリ指定でファイル一覧取得
      const testDir = 'images';
      const result = await listFiles(testDir);
      
      // list関数が正しくディレクトリオプションで呼ばれたことを確認
      expect(list).toHaveBeenCalledWith({ prefix: testDir });
      
      // 期待する結果が返されることを確認
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMimeType', () => {
    const testCases = [
      { filename: 'document.pdf', expected: 'application/pdf' },
      { filename: 'image.jpg', expected: 'image/jpeg' },
      { filename: 'photo.jpeg', expected: 'image/jpeg' },
      { filename: 'image.png', expected: 'image/png' },
      { filename: 'animation.gif', expected: 'image/gif' },
      { filename: 'icon.svg', expected: 'image/svg+xml' },
      { filename: 'document.doc', expected: 'application/msword' },
      { filename: 'spreadsheet.xlsx', expected: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { filename: 'presentation.pptx', expected: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
      { filename: 'readme.txt', expected: 'text/plain' },
      { filename: 'archive.zip', expected: 'application/zip' },
      { filename: 'video.mp4', expected: 'video/mp4' },
      { filename: 'audio.mp3', expected: 'audio/mpeg' },
      { filename: 'unknown.xyz', expected: 'application/octet-stream' },
      { filename: 'noextension', expected: 'application/octet-stream' },
    ];

    testCases.forEach(({ filename, expected }) => {
      it(`should return ${expected} for ${filename}`, () => {
        expect(getMimeType(filename)).toBe(expected);
      });
    });
  });
}); 