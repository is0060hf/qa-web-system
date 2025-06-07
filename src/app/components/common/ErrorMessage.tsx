'use client';

import React from 'react';
import { Alert, AlertTitle, Box, Button, Collapse, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningIcon from '@mui/icons-material/Warning';

export type ErrorType = 'error' | 'warning' | 'network' | 'validation';

interface ErrorMessageProps {
  type?: ErrorType;
  title?: string;
  message: string;
  details?: string | string[] | Record<string, string>;
  onClose?: () => void;
  onRetry?: () => void;
  showIcon?: boolean;
  collapsible?: boolean;
  sx?: any;
}

// エラータイプに応じたデフォルトタイトル
const DEFAULT_TITLES: Record<ErrorType, string> = {
  error: 'エラーが発生しました',
  warning: '警告',
  network: 'ネットワークエラー',
  validation: '入力エラー'
};

// エラータイプに応じたアイコン
const ERROR_ICONS: Record<ErrorType, React.ReactNode> = {
  error: <ErrorOutlineIcon />,
  warning: <WarningIcon />,
  network: <WifiOffIcon />,
  validation: <ErrorOutlineIcon />
};

// エラータイプに応じた重要度
const ERROR_SEVERITY: Record<ErrorType, 'error' | 'warning' | 'info'> = {
  error: 'error',
  warning: 'warning',
  network: 'error',
  validation: 'error'
};

export default function ErrorMessage({
  type = 'error',
  title,
  message,
  details,
  onClose,
  onRetry,
  showIcon = true,
  collapsible = false,
  sx
}: ErrorMessageProps) {
  const [expanded, setExpanded] = React.useState(!collapsible);

  // 詳細情報を整形
  const formatDetails = () => {
    if (!details) return null;

    if (typeof details === 'string') {
      return details;
    }

    if (Array.isArray(details)) {
      return (
        <Box component="ul" sx={{ pl: 2, mb: 0 }}>
          {details.map((detail, index) => (
            <li key={index}>
              <Typography variant="body2">{detail}</Typography>
            </li>
          ))}
        </Box>
      );
    }

    if (typeof details === 'object') {
      return (
        <Box component="ul" sx={{ pl: 2, mb: 0 }}>
          {Object.entries(details).map(([field, error]) => (
            <li key={field}>
              <Typography variant="body2">
                <strong>{field}:</strong> {error}
              </Typography>
            </li>
          ))}
        </Box>
      );
    }

    return null;
  };

  const displayTitle = title || DEFAULT_TITLES[type];
  const hasDetails = !!details;

  return (
    <Alert
      severity={ERROR_SEVERITY[type]}
      icon={showIcon ? ERROR_ICONS[type] : false}
      onClose={onClose}
      sx={{
        mb: 2,
        ...sx
      }}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {onRetry && (
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              color="inherit"
            >
              再試行
            </Button>
          )}
          {hasDetails && collapsible && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              color="inherit"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
          {onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              color="inherit"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      }
    >
      <AlertTitle>{displayTitle}</AlertTitle>
      <Typography variant="body2">{message}</Typography>
      
      {hasDetails && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 1 }}>
            {formatDetails()}
          </Box>
        </Collapse>
      )}
    </Alert>
  );
}

// 一般的なエラーメッセージのヘルパー関数
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.response?.status === 404) {
    return 'リソースが見つかりませんでした';
  }

  if (error?.response?.status === 403) {
    return 'このアクションを実行する権限がありません';
  }

  if (error?.response?.status === 401) {
    return '認証が必要です。ログインしてください';
  }

  if (error?.response?.status >= 500) {
    return 'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください';
  }

  if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
    return 'ネットワークに接続できません。インターネット接続を確認してください';
  }

  return '予期しないエラーが発生しました';
};

// APIエラーからエラータイプを判定するヘルパー関数
export const getErrorType = (error: any): ErrorType => {
  if (error?.response?.status === 422 || error?.response?.data?.errors) {
    return 'validation';
  }

  if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
    return 'network';
  }

  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return 'warning';
  }

  return 'error';
}; 