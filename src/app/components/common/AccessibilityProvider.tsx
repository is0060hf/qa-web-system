'use client';

import React, { useState, useEffect } from 'react';
import { Box, Link, styled, useTheme } from '@mui/material';

// フォーカススタイルを適用するためのグローバルスタイル
const SkipLink = styled(Link)(({ theme }) => ({
  position: 'absolute',
  top: '-40px',
  left: 0,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1, 2),
  zIndex: theme.zIndex.tooltip,
  textDecoration: 'none',
  transition: 'top 0.2s ease-in-out',
  '&:focus': {
    top: 0,
  },
}));

/**
 * アクセシビリティ機能を提供するプロバイダーコンポーネント
 * - キーボードユーザーのためのスキップリンク
 * - キーボードフォーカス状態の検出
 */
export default function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const [isUsingKeyboard, setIsUsingKeyboard] = useState(false);

  useEffect(() => {
    // キーボードナビゲーション検出
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsUsingKeyboard(true);
        
        // キーボードユーザー用のフォーカススタイルを適用
        document.body.classList.add('keyboard-user');
      }
    };

    // マウスクリック検出
    const handleMouseDown = () => {
      setIsUsingKeyboard(false);
      
      // キーボードユーザー用のフォーカススタイルを解除
      document.body.classList.remove('keyboard-user');
    };

    // グローバルCSSの追加
    const style = document.createElement('style');
    style.innerHTML = `
      /* デフォルトのアウトラインを非表示 */
      body:not(.keyboard-user) *:focus {
        outline: none;
      }
      
      /* キーボードユーザー用のアウトラインスタイル */
      body.keyboard-user *:focus {
        outline: 2px solid ${theme.palette.primary.main};
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);

    // イベントリスナー登録
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      // クリーンアップ
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.head.removeChild(style);
    };
  }, [theme.palette.primary.main]);

  return (
    <>
      {/* スキップリンク - キーボードユーザーがメインコンテンツに直接移動できるようにする */}
      <SkipLink href="#main-content" aria-label="メインコンテンツにスキップ">
        メインコンテンツにスキップ
      </SkipLink>
      
      {/* 子コンポーネント */}
      {children}
    </>
  );
} 