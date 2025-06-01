'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
  isInitialized: boolean;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
  isInitialized: false,
});

export const useThemeContext = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

// ローカルストレージのキー名を定数化
const THEME_STORAGE_KEY = 'qa-system-theme-mode';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 初期化フラグを追加して、クライアントサイドでの初期化が完了したかを管理
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 初期値をシステム設定に基づいて決定（SSRでも動作する）
  const getInitialMode = (): PaletteMode => {
    // SSRの場合は'light'を返す
    if (typeof window === 'undefined') {
      return 'light';
    }
    
    // クライアントサイドの場合
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as PaletteMode | null;
    if (savedMode === 'light' || savedMode === 'dark') {
      return savedMode;
    }
    
    // システム設定を確認
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };
  
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  // クライアントサイドでのみ実行される初期化処理
  useEffect(() => {
    // クライアントサイドで再度モードを確認して設定
    const clientMode = getInitialMode();
    setMode(clientMode);
    setIsInitialized(true);
    
    // システム設定の変更を監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // ユーザーが明示的に設定を保存していない場合のみ、システム設定に従う
      const savedMode = localStorage.getItem(THEME_STORAGE_KEY);
      if (!savedMode) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    
    // イベントリスナーを追加
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    } else {
      mediaQuery.addEventListener('change', handleChange);
    }
    
    // クリーンアップ
    return () => {
      if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      } else {
        mediaQuery.removeEventListener('change', handleChange);
      }
    };
  }, []);

  // モード変更時にlocalStorageに保存
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      // HTML要素にdata属性を設定してCSSでも利用できるようにする
      document.documentElement.setAttribute('data-theme', mode);
      
      // body要素にもクラスを追加（Material-UIのテーマと連携）
      document.body.classList.remove('light-mode', 'dark-mode');
      document.body.classList.add(`${mode}-mode`);
    }
  }, [mode, isInitialized]);

  // テーマ切り替え関数
  const toggleColorMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      console.log(`[Theme] Switching from ${prevMode} to ${newMode}`);
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        toggleColorMode,
        isInitialized,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}; 