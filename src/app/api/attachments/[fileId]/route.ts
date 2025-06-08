import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/utils/api';
import prisma from '@/lib/db';
import { withLogging, logAuditEvent, logError, logger } from '@/lib/utils/logger';
import { deleteFile } from '@/lib/utils/blob';

// ファイルダウンロード & メタデータ取得
const _GET = async (
  req: NextRequest,
  { params }: { params: { fileId: string } }
) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { fileId } = params;

    // ファイル情報を取得
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: fileId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!mediaFile) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 404 }
      );
    }

    // アクセス権限の確認
    // 管理者または本人はアクセス可能
    if (user.role !== 'ADMIN' && mediaFile.uploaderId !== user.id) {
      // プロジェクトメンバーかチェック
      const answerMediaFiles = await prisma.answerMediaFile.findFirst({
        where: { mediaFileId: fileId },
        include: {
          answer: {
            include: {
              question: {
                include: {
                  project: {
                    include: {
                      members: {
                        where: { userId: user.id },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const formDataFiles = await prisma.answerFormData.findFirst({
        where: { mediaFileId: fileId },
        include: {
          answer: {
            include: {
              question: {
                include: {
                  project: {
                    include: {
                      members: {
                        where: { userId: user.id },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const hasAccess = 
        (answerMediaFiles && answerMediaFiles.answer.question.project.members.length > 0) ||
        (formDataFiles && formDataFiles.answer.question.project.members.length > 0);

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'このファイルへのアクセス権限がありません' },
          { status: 403 }
        );
      }
    }

    // メタデータのみを返すかチェック
    const isMetadataOnly = req.nextUrl.searchParams.get('metadata') === 'true';

    if (isMetadataOnly) {
      // 監査ログ: ファイルメタデータの取得
      logAuditEvent('VIEW_FILE_METADATA', user.id, 'MediaFile', fileId);
      
      // メタデータのみを返す
      return NextResponse.json({
        id: mediaFile.id,
        fileName: mediaFile.fileName,
        fileType: mediaFile.fileType,
        fileSize: mediaFile.fileSize,
        uploaderId: mediaFile.uploaderId,
        uploader: mediaFile.uploader,
        createdAt: mediaFile.createdAt,
        downloadUrl: mediaFile.storageUrl,
      });
    }

    // 監査ログ: ファイルのダウンロード
    logAuditEvent('DOWNLOAD_FILE', user.id, 'MediaFile', fileId, {
      fileName: mediaFile.fileName,
      fileSize: mediaFile.fileSize,
    });

    // ファイルのダウンロードリダイレクト
    return NextResponse.redirect(mediaFile.storageUrl);
  } catch (error) {
    logError(error, { operation: 'GET_FILE', fileId: params.fileId });
    return NextResponse.json(
      { error: 'ファイルの取得に失敗しました' },
      { status: 500 }
    );
  }
};

export const GET = withLogging(_GET);

// ファイル削除
const _DELETE = async (
  req: NextRequest,
  { params }: { params: { fileId: string } }
) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { fileId } = params;

    // ファイル情報を取得
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!mediaFile) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 404 }
      );
    }

    // 削除権限の確認（管理者またはアップロード者のみ）
    if (user.role !== 'ADMIN' && mediaFile.uploaderId !== user.id) {
      return NextResponse.json(
        { error: 'このファイルを削除する権限がありません' },
        { status: 403 }
      );
    }

    // ファイルの使用状況を確認
    const [answersCount, formDataCount, profileUsersCount] = await Promise.all([
      prisma.answerMediaFile.count({ where: { mediaFileId: fileId } }),
      prisma.answerFormData.count({ where: { mediaFileId: fileId } }),
      prisma.user.count({ where: { profileImageId: fileId } }),
    ]);

    const isUsed = answersCount > 0 || formDataCount > 0 || profileUsersCount > 0;

    if (isUsed) {
      return NextResponse.json(
        { 
          error: 'このファイルは使用中のため削除できません',
          details: {
            usedInAnswers: answersCount,
            usedInFormData: formDataCount,
            usedAsProfileImage: profileUsersCount,
          }
        },
        { status: 400 }
      );
    }

    // Vercel Blobからファイルを削除
    try {
      const deleted = await deleteFile(mediaFile.storageUrl);
      if (!deleted) {
        logger.warn('Blobストレージからのファイル削除に失敗しました', { fileId, url: mediaFile.storageUrl });
      }
    } catch (blobError) {
      logError(blobError, { operation: 'DELETE_BLOB_FILE', fileId, url: mediaFile.storageUrl });
      // Blobからの削除に失敗してもDB削除は続行
    }

    // データベースから削除
    await prisma.mediaFile.delete({
      where: { id: fileId },
    });

    // 監査ログ: ファイル削除成功
    logAuditEvent('DELETE_FILE', user.id, 'MediaFile', fileId, {
      fileName: mediaFile.fileName,
      fileSize: mediaFile.fileSize,
    });

    return NextResponse.json({
      message: 'ファイルを削除しました',
      deletedFileId: fileId,
    });
  } catch (error) {
    logError(error, { operation: 'DELETE_FILE', fileId: params.fileId });
    return NextResponse.json(
      { error: 'ファイルの削除に失敗しました' },
      { status: 500 }
    );
  }
};

export const DELETE = withLogging(_DELETE); 