'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, useThemeContext } from './ThemeProvider';
import { createAppTheme } from '../theme/theme';

// テーマを適用するためのラッパーコンポーネント
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  // ThemeContextからモード情報を取得
  const { mode } = useThemeContext();
  
  // 現在のモードに基づいてテーマを作成
  const theme = createAppTheme(mode);

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