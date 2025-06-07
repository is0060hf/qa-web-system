'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Card, CardContent, Typography, Alert, Stack } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーログをコンソールに出力（本番環境では外部サービスに送信）
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // TODO: 本番環境ではSentryなどのエラー追跡サービスに送信
    // if (process.env.NODE_ENV === 'production') {
    //   // Sentry.captureException(error);
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックが提供されている場合
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // デフォルトのエラー表示
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            bgcolor: 'background.default'
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <ErrorOutlineIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 3
                }}
              />
              
              <Typography variant="h4" gutterBottom>
                エラーが発生しました
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph>
                申し訳ございません。予期しないエラーが発生しました。
                問題が続く場合は、システム管理者にお問い合わせください。
              </Typography>

              {/* 開発環境でのみエラー詳細を表示 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert severity="error" sx={{ mt: 3, mb: 3, textAlign: 'left' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    エラー詳細:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {this.state.error.toString()}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography variant="body2" component="pre" sx={{ mt: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Alert>
              )}

              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                >
                  再試行
                </Button>
                <Button
                  variant="contained"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                >
                  ホームに戻る
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 