'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // ローカルストレージからテーマ設定を読み込む（初期値は'light'）
  const [mode, setMode] = useState<PaletteMode>('light');

  // クライアントサイドでのみ実行
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as PaletteMode | null;
    // ユーザーの設定があれば適用、なければシステム設定を確認
    if (savedMode) {
      setMode(savedMode);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }
  }, []);

  // モード変更時にlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    // HTML要素にdata属性を設定してCSSでも利用できるようにする
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  // テーマ切り替え関数
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}; 