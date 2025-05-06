import { NextRequest, NextResponse } from 'next/server';
import { GET as getMediaFiles, POST as createMediaFile } from '@/app/api/media/route';
import { GET as getMediaFile, DELETE as deleteMediaFile } from '@/app/api/media/[fileId]/route';
import { POST as getUploadUrl } from '@/app/api/media/upload-url/route';
import { Role } from '@prisma/client';
import prisma from '@/lib/db';
import { createAuthenticatedRequest } from '../utils/test-helpers';

// NextResponse.jsonをモック
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((body, init) => {
        return {
          body,
          status: init?.status || 200,
        };
      }),
    },
  };
});

describe('Media API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/media', () => {
    it('should return unauthorized when not authenticated', async () => {
      // 未認証リクエスト
      const req = new NextRequest('https://example.com/api/media');
      
      // API呼び出し
      const response = await getMediaFiles(req);
      
      // 401 Unauthorizedが返ることを確認
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return media files for regular user (own files only)', async () => {
      // モック設定
      const mockFiles = [
        { id: 'file1', fileName: 'test1.pdf', uploaderId: 'test-user-id' },
        { id: 'file2', fileName: 'test2.jpg', uploaderId: 'test-user-id' },
      ];
      
      (prisma.mediaFile.findMany as jest.Mock).mockResolvedValue(mockFiles);
      
      // 認証済みリクエスト（通常ユーザー）
      const req = createAuthenticatedRequest(
        'GET',
        'https://example.com/api/media',
        'test-user-id',
        'test@example.com',
        Role.USER
      );
      
      // API呼び出し
      const response = await getMediaFiles(req);
      
      // 成功レスポンスを確認
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files', mockFiles);
      
      // クエリが正しく構築されていることを確認
      expect(prisma.mediaFile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            uploaderId: 'test-user-id',
          }),
        })
      );
    });

    it('should return all media files for admin user', async () => {
      // モック設定
      const mockFiles = [
        { id: 'file1', fileName: 'test1.pdf', uploaderId: 'test-user-id' },
        { id: 'file2', fileName: 'test2.jpg', uploaderId: 'another-user-id' },
      ];
      
      (prisma.mediaFile.findMany as jest.Mock).mockResolvedValue(mockFiles);
      
      // 認証済みリクエスト（管理者）
      const req = createAuthenticatedRequest(
        'GET',
        'https://example.com/api/media',
        'admin-id',
        'admin@example.com',
        Role.ADMIN
      );
      
      // API呼び出し
      const response = await getMediaFiles(req);
      
      // 成功レスポンスを確認
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files', mockFiles);
      
      // クエリに uploaderId フィルターがないことを確認
      expect(prisma.mediaFile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            uploaderId: expect.anything(),
          }),
        })
      );
    });

    it('should handle query parameters correctly', async () => {
      // モック設定
      const mockFiles = [{ id: 'file1', fileName: 'test1.pdf' }];
      (prisma.mediaFile.findMany as jest.Mock).mockResolvedValue(mockFiles);
      
      // クエリパラメータ付き認証済みリクエスト
      const req = createAuthenticatedRequest(
        'GET',
        'https://example.com/api/media?limit=10&cursor=last-id&type=image',
        'test-user-id',
        'test@example.com',
        Role.USER
      );
      
      // API呼び出し
      const response = await getMediaFiles(req);
      
      // 成功レスポンスを確認
      expect(response.status).toBe(200);
      
      // クエリパラメータが正しく処理されていることを確認
      expect(prisma.mediaFile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          cursor: { id: 'last-id' },
          skip: 1,
          where: expect.objectContaining({
            uploaderId: 'test-user-id',
            fileType: { startsWith: 'image' },
          }),
        })
      );
    });
  });

  describe('POST /api/media', () => {
    it('should create a media file record', async () => {
      // モックデータ
      const mediaData = {
        fileName: 'test.pdf',
        fileSize: 12345,
        fileType: 'application/pdf',
        storageUrl: 'https://test-blob-storage.vercel.app/test.pdf',
      };
      
      const createdMedia = {
        id: 'new-file-id',
        ...mediaData,
        uploaderId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // モック設定
      (prisma.mediaFile.create as jest.Mock).mockResolvedValue(createdMedia);
      
      // 認証済みリクエスト
      const req = createAuthenticatedRequest(
        'POST',
        'https://example.com/api/media',
        'test-user-id',
        'test@example.com',
        Role.USER,
        mediaData
      );
      
      // API呼び出し
      const response = await createMediaFile(req);
      
      // 成功レスポンスを確認
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdMedia);
      
      // DBへの保存が正しく行われていることを確認
      expect(prisma.mediaFile.create).toHaveBeenCalledWith({
        data: {
          ...mediaData,
          uploaderId: 'test-user-id',
        },
      });
    });

    it('should validate request data', async () => {
      // 不十分なデータ
      const invalidData = {
        fileName: 'test.pdf',
        // fileSize と fileType が不足
        storageUrl: 'https://example.com/test.pdf',
      };
      
      // 認証済みリクエスト
      const req = createAuthenticatedRequest(
        'POST',
        'https://example.com/api/media',
        'test-user-id',
        'test@example.com',
        Role.USER,
        invalidData
      );
      
      // API呼び出し
      const response = await createMediaFile(req);
      
      // バリデーションエラーレスポンスを確認
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      
      // DBへの保存が呼ばれていないことを確認
      expect(prisma.mediaFile.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/media/[fileId]', () => {
    it('should return a media file by ID', async () => {
      // モックデータ
      const mockFile = {
        id: 'test-file-id',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploaderId: 'test-user-id',
      };
      
      // モック設定
      (prisma.mediaFile.findUnique as jest.Mock).mockResolvedValue(mockFile);
      
      // 認証済みリクエスト
      const req = createAuthenticatedRequest(
        'GET',
        'https://example.com/api/media/test-file-id',
        'test-user-id',
        'test@example.com',
        Role.USER
      );
      
      // パラメータオブジェクト
      const params = { fileId: 'test-file-id' };
      
      // API呼び出し
      const response = await getMediaFile(req, { params });
      
      // 成功レスポンスを確認
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFile);
    });

    it('should deny access to files uploaded by other users', async () => {
      // 他ユーザーのファイル
      const mockFile = {
        id: 'test-file-id',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploaderId: 'another-user-id', // 別ユーザー
      };
      
      // モック設定
      (prisma.mediaFile.findUnique as jest.Mock).mockResolvedValue(mockFile);
      
      // 認証済みリクエスト
      const req = createAuthenticatedRequest(
        'GET',
        'https://example.com/api/media/test-file-id',
        'test-user-id', // アップロード者とは異なるユーザー
        'test@example.com',
        Role.USER
      );
      
      // パラメータオブジェクト
      const params = { fileId: 'test-file-id' };
      
      // API呼び出し
      const response = await getMediaFile(req, { params });
      
      // アクセス拒否（403 Forbidden）を確認
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/media/[fileId]', () => {
    it('should delete a media file', async () => {
      // モックデータ
      const mockFile = {
        id: 'test-file-id',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        uploaderId: 'test-user-id',
        storageUrl: 'https://test-blob-storage.vercel.app/test.pdf',
        answers: [],
        formData: [],
      };
      
      // モック設定
      (prisma.mediaFile.findUnique as jest.Mock).mockResolvedValue(mockFile);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });
      
      // 認証済みリクエスト
      const req = createAuthenticatedRequest(
        'DELETE',
        'https://example.com/api/media/test-file-id',
        'test-user-id',
        'test@example.com',
        Role.USER
      );
      
      // パラメータオブジェクト
      const params = { fileId: 'test-file-id' };
      
      // API呼び出し
      const response = await deleteMediaFile(req, { params });
      
      // 成功レスポンスを確認
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('result');
      
      // ファイルの削除処理が行われていることを確認
      expect(prisma.mediaFile.delete).toHaveBeenCalledWith({
        where: { id: 'test-file-id' },
      });
    });

    it('should prevent deletion of files referenced by answers', async () => {
      // 回答で参照されているファイル
      const mockFile = {
        id: 'test-file-id',
        fileName: 'test.pdf',
        uploaderId: 'test-user-id',
        storageUrl: 'https://test-blob-storage.vercel.app/test.pdf',
        answers: [{ id: 'answer-1' }], // 回答で使用されている
        formData: [],
      };
      
      // モック設定
      (prisma.mediaFile.findUnique as jest.Mock).mockResolvedValue(mockFile);
      
      // 認証済みリクエスト
      const req = createAuthenticatedRequest(
        'DELETE',
        'https://example.com/api/media/test-file-id',
        'test-user-id',
        'test@example.com',
        Role.USER
      );
      
      // パラメータオブジェクト
      const params = { fileId: 'test-file-id' };
      
      // API呼び出し
      const response = await deleteMediaFile(req, { params });
      
      // 競合エラー（409 Conflict）を確認
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
      
      // 削除処理が呼ばれていないことを確認
      expect(prisma.mediaFile.delete).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/media/upload-url', () => {
    it('should generate a signed upload URL', async () => {
      // モックデータ
      const requestData = {
        fileName: 'test.pdf',
        contentType: 'application/pdf',
        directory: 'uploads',
      };
      
      const mockResult = {
        uploadUrl: 'https://test-upload-url.vercel.app/uploads/test-user-id/test.pdf',
        url: 'https://test-blob-storage.vercel.app/uploads/test-user-id/test.pdf',
      };
      
      // put関数の戻り値をセット（setupTests.jsのモックがここで使用される）
      
      // 認証済みリクエスト
      const req = createAuthenticatedRequest(
        'POST',
        'https://example.com/api/media/upload-url',
        'test-user-id',
        'test@example.com',
        Role.USER,
        requestData
      );
      
      // API呼び出し
      const response = await getUploadUrl(req);
      
      // 成功レスポンスを確認
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uploadUrl');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('fileName', 'test.pdf');
      expect(response.body).toHaveProperty('fileType', 'application/pdf');
    });

    it('should reject invalid content types', async () => {
      // 不一致のコンテンツタイプ
      const requestData = {
        fileName: 'test.pdf',
        contentType: 'image/jpeg', // PDFなのにJPEGと偽っている
        directory: 'uploads',
      };
      
      // 認証済みリクエスト
      const req = createAuthenticatedRequest(
        'POST',
        'https://example.com/api/media/upload-url',
        'test-user-id',
        'test@example.com',
        Role.USER,
        requestData
      );
      
      // API呼び出し
      const response = await getUploadUrl(req);
      
      // バリデーションエラー（400 Bad Request）を確認
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 