'use client';

import React, { createContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, initializeAuth } from './stores/authStore';
import { CircularProgress, Box, Typography } from '@mui/material';

// グローバルコンテキストの作成（必要に応じて使用）
export const AuthContext = createContext<null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isLoading, user, fetchCurrentUser } = useAuthStore();
  const pathname = usePathname();
  
  // アプリ起動時に認証状態を復元
  useEffect(() => {
    // 認証状態の初期化
    initializeAuth();
    
    // 初期化完了のフラグ設定
    setIsInitialized(true);
  }, []);
  
  // 認証の初期化中はローディング表示
  if (!isInitialized || (isInitialized && isLoading)) {
    // 認証系のページでは表示しない
    if (
      pathname === '/login' ||
      pathname === '/register' ||
      pathname.startsWith('/reset-password')
    ) {
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