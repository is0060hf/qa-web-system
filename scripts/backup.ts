import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../src/lib/utils/logger';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// バックアップ設定
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DB_URL = process.env.DATABASE_URL || '';
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');

// バックアップディレクトリの作成
async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.mkdir(path.join(BACKUP_DIR, 'database'), { recursive: true });
    await fs.mkdir(path.join(BACKUP_DIR, 'files'), { recursive: true });
  } catch (error) {
    logger.error('バックアップディレクトリの作成に失敗しました', error);
    throw error;
  }
}

// データベースのバックアップ
async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, 'database', `backup-${timestamp}.sql`);

  try {
    logger.info('データベースバックアップを開始します');

    // PostgreSQLの場合の例（DATABASE_URLから接続情報を抽出）
    const dbUrl = new URL(DB_URL);
    const dbName = dbUrl.pathname.substring(1);
    const dbHost = dbUrl.hostname;
    const dbPort = dbUrl.port || '5432';
    const dbUser = dbUrl.username;
    const dbPassword = dbUrl.password;

    // pg_dumpコマンドを実行
    const command = `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${backupFile}`;
    
    await execAsync(command);
    
    // バックアップファイルを圧縮
    await execAsync(`gzip ${backupFile}`);
    
    logger.info(`データベースバックアップが完了しました: ${backupFile}.gz`);
    return `${backupFile}.gz`;
  } catch (error) {
    logger.error('データベースバックアップに失敗しました', error);
    throw error;
  }
}

// メディアファイルのバックアップ
async function backupMediaFiles() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(BACKUP_DIR, 'files', `media-${timestamp}`);

  try {
    logger.info('メディアファイルのバックアップを開始します');

    // データベースから全メディアファイル情報を取得
    const mediaFiles = await prisma.mediaFile.findMany({
      select: {
        id: true,
        fileName: true,
        storageUrl: true,
        createdAt: true,
      },
    });

    // バックアップディレクトリを作成
    await fs.mkdir(backupDir, { recursive: true });

    // メディアファイルのメタデータを保存
    const metadataFile = path.join(backupDir, 'metadata.json');
    await fs.writeFile(metadataFile, JSON.stringify(mediaFiles, null, 2));

    logger.info(`${mediaFiles.length}個のメディアファイル情報を保存しました`);

    // Vercel Blobの場合の注意事項
    logger.info('注意: Vercel Blobのファイルは直接バックアップできません。');
    logger.info('Vercel Blobの管理画面または APIを使用してバックアップを行ってください。');

    // tarアーカイブを作成
    const archiveFile = `${backupDir}.tar.gz`;
    await execAsync(`tar -czf ${archiveFile} -C ${path.dirname(backupDir)} ${path.basename(backupDir)}`);
    
    // 元のディレクトリを削除
    await fs.rm(backupDir, { recursive: true });

    logger.info(`メディアファイルのバックアップが完了しました: ${archiveFile}`);
    return archiveFile;
  } catch (error) {
    logger.error('メディアファイルのバックアップに失敗しました', error);
    throw error;
  }
}

// 古いバックアップの削除
async function cleanupOldBackups() {
  try {
    logger.info('古いバックアップのクリーンアップを開始します');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);

    // データベースバックアップのクリーンアップ
    const dbBackupDir = path.join(BACKUP_DIR, 'database');
    const dbFiles = await fs.readdir(dbBackupDir);
    
    for (const file of dbFiles) {
      const filePath = path.join(dbBackupDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        logger.info(`古いバックアップを削除しました: ${file}`);
      }
    }

    // メディアファイルバックアップのクリーンアップ
    const filesBackupDir = path.join(BACKUP_DIR, 'files');
    const mediaFiles = await fs.readdir(filesBackupDir);
    
    for (const file of mediaFiles) {
      const filePath = path.join(filesBackupDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        logger.info(`古いバックアップを削除しました: ${file}`);
      }
    }

    logger.info('古いバックアップのクリーンアップが完了しました');
  } catch (error) {
    logger.error('バックアップのクリーンアップに失敗しました', error);
    // クリーンアップの失敗はバックアップ処理全体を止めない
  }
}

// メイン処理
async function main() {
  try {
    logger.info('バックアップ処理を開始します');
    
    await ensureBackupDir();
    
    // 並行してバックアップを実行
    const [dbBackup, mediaBackup] = await Promise.all([
      backupDatabase(),
      backupMediaFiles(),
    ]);
    
    // 古いバックアップをクリーンアップ
    await cleanupOldBackups();
    
    logger.info('バックアップ処理が完了しました', {
      database: dbBackup,
      media: mediaBackup,
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('バックアップ処理に失敗しました', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main();
} 