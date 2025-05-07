'use client';

import React, { createContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, initializeAuth } from './stores/authStore';
import { CircularProgress, Box, Typography } from '@mui/material';

// グローバルコンテキストの作成（必要に応じて使用）
export const AuthContext = createContext<null>(null);

// 認証不要のパス
const publicPaths = [
  '/login',
  '/register',
  '/reset-password',
];

// パスが認証不要パスにマッチするか確認する関数
const isPublicPath = (path: string): boolean => {
  return publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isLoading, user, fetchCurrentUser } = useAuthStore();
  const pathname = usePathname();
  
  // 現在のパスが認証が必要かどうか
  const isCurrentPathPublic = isPublicPath(pathname);
  
  // アプリ起動時に認証状態を復元
  useEffect(() => {
    // 認証不要のパスでは認証チェックをスキップ
    if (!isCurrentPathPublic) {
      // 認証状態の初期化（認証が必要なページのみ）
      initializeAuth();
    } else {
      // 認証不要ページではローディング状態をリセット
      useAuthStore.setState({ isLoading: false });
    }
    
    // 初期化完了のフラグ設定
    setIsInitialized(true);
  }, [isCurrentPathPublic]);
  
  // 認証の初期化中はローディング表示
  if (!isInitialized || (isInitialized && isLoading && !isCurrentPathPublic)) {
    // 認証不要のページではロード表示しない
    if (isCurrentPathPublic) {
      return <>{children}</>;
    }
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>ログイン情報を確認中...</Typography>
      </Box>
    );
  }
  
  return (
    <AuthContext.Provider value={null}>
      {children}
    </AuthContext.Provider>
  );
} 