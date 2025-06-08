import pino from 'pino';
import { NextRequest } from 'next/server';

// 環境に応じたログレベル
const validLogLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
const envLogLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const logLevel = validLogLevels.includes(envLogLevel) ? envLogLevel : 'info';

// 基本的なロガー設定
const baseOptions: pino.LoggerOptions = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
};

// 開発環境用の設定
const devOptions: pino.LoggerOptions = {
  ...baseOptions,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
};

// 本番環境用の設定
const prodOptions: pino.LoggerOptions = {
  ...baseOptions,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
};

// メインロガー
export const logger = pino(process.env.NODE_ENV === 'production' ? prodOptions : devOptions);

// 特定用途のロガー
export const accessLogger = logger.child({ type: 'access' });
export const errorLogger = logger.child({ type: 'error' });
export const auditLogger = logger.child({ type: 'audit' });

// リクエスト情報を抽出するヘルパー関数
export function extractRequestInfo(req: NextRequest) {
  return {
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.headers.get('user-agent'),
      'x-forwarded-for': req.headers.get('x-forwarded-for'),
      'x-real-ip': req.headers.get('x-real-ip'),
    },
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
  };
}

// APIレスポンスログ用のヘルパー関数
export function logApiResponse(
  req: NextRequest,
  status: number,
  duration: number,
  userId?: string,
  error?: any
) {
  const logData = {
    ...extractRequestInfo(req),
    status,
    duration,
    userId,
  };

  if (status >= 500) {
    errorLogger.error({ ...logData, error }, 'Internal server error');
  } else if (status >= 400) {
    accessLogger.warn(logData, 'Client error');
  } else {
    accessLogger.info(logData, 'Request completed');
  }
}

// 監査ログ用のヘルパー関数
export function logAuditEvent(
  action: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  details?: any,
  success: boolean = true
) {
  auditLogger.info({
    action,
    userId,
    resourceType,
    resourceId,
    details,
    success,
    timestamp: new Date().toISOString(),
  }, `Audit: ${action} on ${resourceType}`);
}

// エラーログ用のヘルパー関数
export function logError(error: any, context?: any) {
  const errorInfo = {
    message: error.message || 'Unknown error',
    stack: error.stack,
    name: error.name,
    ...context,
  };

  errorLogger.error(errorInfo, 'Application error');
}

// APIハンドラーをラップするヘルパー関数
type ApiHandler = (req: NextRequest, ...args: any[]) => Promise<Response>;

export function withLogging(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    let status = 200;
    let userId: string | undefined;

    try {
      const response = await handler(req, ...args);
      
      // レスポンスからステータスコードを取得
      if (response && typeof response.status === 'number') {
        status = response.status;
      }

      // ユーザーIDを取得（getUserFromRequestが利用可能な場合）
      try {
        const { getUserFromRequest } = await import('@/lib/utils/api');
        const user = getUserFromRequest(req);
        userId = user?.id;
      } catch {}

      logApiResponse(req, status, Date.now() - startTime, userId);
      return response;
    } catch (error) {
      status = 500;
      logApiResponse(req, status, Date.now() - startTime, userId, error);
      throw error;
    }
  };
} 