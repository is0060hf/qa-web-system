'use client';

import { createTheme, Theme, PaletteMode } from '@mui/material/styles';

// テーマ作成関数 - モード（ライト/ダーク）に基づいてテーマを返す
export const createAppTheme = (mode: PaletteMode): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#2563eb', // 青色
        light: '#3b82f6',
        dark: '#1d4ed8',
        contrastText: '#fff',
      },
      secondary: {
        main: '#7c3aed', // 紫色
        light: '#8b5cf6',
        dark: '#6d28d9',
        contrastText: '#fff',
      },
      error: {
        main: '#ef4444',
      },
      warning: {
        main: '#f59e0b',
      },
      info: {
        main: '#3b82f6',
      },
      success: {
        main: '#10b981',
      },
      ...(mode === 'light'
        ? {
            // ライトモード固有の設定
            background: {
              default: '#f9fafb',
              paper: '#ffffff',
            },
            text: {
              primary: 'rgba(0, 0, 0, 0.87)',
              secondary: 'rgba(0, 0, 0, 0.6)',
            },
          }
        : {
            // ダークモード固有の設定
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            },
            text: {
              primary: '#ffffff',
              secondary: 'rgba(255, 255, 255, 0.7)',
            },
          }),
    },
    typography: {
      fontFamily: '"Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            textTransform: 'none',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            marginBottom: 16,
          },
        },
      },
      // アクセシビリティ向上のための追加スタイル
      MuiCssBaseline: {
        styleOverrides: {
          // グローバルスタイルを適用
          '&:focus-visible': {
            outline: `2px solid ${mode === 'light' ? '#2563eb' : '#3b82f6'}`,
            outlineOffset: '2px',
          },
        },
      },
    },
  });
};

// デフォルトテーマ（ライトモード）
const theme = createAppTheme('light');

export default theme; 