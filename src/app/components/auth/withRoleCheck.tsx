'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ReactElement } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import { useAuthStore } from '@/app/stores/authStore';

// ユーザーロールの型定義
export type UserRole = 'ADMIN' | 'USER';

// プロジェクトロールの型定義
export type ProjectRole = 'MANAGER' | 'MEMBER';

interface WithRoleCheckProps {
  allowedRoles: UserRole[]; // アクセスを許可するロール
  projectId?: string; // プロジェクトIDが必要な場合
  requiredProjectRole?: ProjectRole[]; // 必要なプロジェクトロール
}

/**
 * ロールベースのアクセス制御を実装する高階コンポーネント
 * 
 * @param Component ラップするコンポーネント
 * @param options アクセス制御オプション
 * @returns ロールチェック機能を持つコンポーネント
 */
export default function withRoleCheck<P extends object>(
  Component: React.ComponentType<P>,
  { allowedRoles, projectId, requiredProjectRole }: WithRoleCheckProps
) {
  return function ProtectedComponent(props: P): ReactElement {
    const router = useRouter();
    const { user, isLoading, checkProjectRole } = useAuthStore();

    useEffect(() => {
      // 認証情報の読み込み中は何もしない
      if (isLoading) return;

      // ユーザーが存在しない場合はログインページへリダイレクト
      if (!user) {
        router.push('/login');
        return;
      }

      // グローバルロールのチェック
      const hasAllowedRole = allowedRoles.includes(user.role as UserRole);
      
      // プロジェクトロールのチェック（必要な場合）
      let hasRequiredProjectRole = true;
      if (projectId && requiredProjectRole) {
        hasRequiredProjectRole = requiredProjectRole.some(role => 
          checkProjectRole(projectId, role)
        );
      }

      // いずれかのロールチェックに失敗した場合は403ページへリダイレクト
      if (!hasAllowedRole || !hasRequiredProjectRole) {
        router.push('/403');
      }
    }, [user, isLoading, router, projectId, checkProjectRole]);

    // 認証情報の読み込み中はローディング表示
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>認証情報を確認中...</Typography>
        </Box>
      );
    }

    // ユーザーが存在しない場合は何も表示しない（useEffectでリダイレクト処理を行う）
    if (!user) {
      return <></>;
    }

    // 権限チェックをパスした場合はコンポーネントを表示
    return <Component {...props} />;
  };
} 