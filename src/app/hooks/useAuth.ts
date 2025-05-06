import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole, ProjectRole } from '../components/auth/withRoleCheck';

// 認証関連のカスタムフック
export const useAuth = () => {
  const { user, isLoading, error, token, login, logout, register, checkProjectRole } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // 現在のユーザーがログインしているかどうか
  const isAuthenticated = !!user && !!token;
  
  // 現在のユーザーが特定のロールを持っているかどうか
  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };
  
  // 現在のユーザーが特定のプロジェクトに対して特定のロールを持っているかどうか
  const hasProjectRole = (projectId: string, role: ProjectRole): boolean => {
    if (!user) return false;
    // ADMINは全てのプロジェクトに対して全ての権限を持つ
    if (user.role === 'ADMIN') return true;
    return checkProjectRole(projectId, role);
  };
  
  // プロテクトされたルートへのリダイレクト（未認証の場合）
  const requireAuth = () => {
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }, [isLoading, isAuthenticated]);
    
    return { isLoading, isAuthenticated };
  };
  
  // 認証済みユーザー向けのルートへのリダイレクト（認証済みの場合）
  const redirectIfAuthenticated = (path = '/') => {
    useEffect(() => {
      if (!isLoading && isAuthenticated) {
        router.replace(path);
      }
    }, [isLoading, isAuthenticated]);
    
    return { isLoading, isAuthenticated };
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    register,
    hasRole,
    hasProjectRole,
    requireAuth,
    redirectIfAuthenticated,
  };
}; 