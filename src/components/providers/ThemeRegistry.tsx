'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider, useThemeContext } from './ThemeProvider';
import { createAppTheme } from '../theme/theme';

// テーマを適用するためのラッパーコンポーネント
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  // ThemeContextからモード情報を取得
  const { mode, isInitialized } = useThemeContext();
  
  // 現在のモードに基づいてテーマを作成
  const theme = createAppTheme(mode);

  // 初期化が完了していない場合は、ローディング表示
  // ただし、短時間のちらつきを防ぐため、最小限の表示にする
  if (!isInitialized) {
    return (
      <MuiThemeProvider theme={createAppTheme('light')}>
        <CssBaseline />
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.default',
            opacity: 0, // 透明にして表示しない
            pointerEvents: 'none',
          }}
        >
          <CircularProgress />
        </Box>
      </MuiThemeProvider>
    );
  }

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

// メインのThemeRegistryコンポーネント
export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeWrapper>
        {children}
      </ThemeWrapper>
    </ThemeProvider>
  );
} 