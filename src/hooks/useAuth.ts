import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchData } from '@/lib/utils/fetchData';

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // ユーザー情報を取得
    const fetchUser = async () => {
      try {
        // fetch APIの代わりにfetchData関数を使用
        const userData = await fetchData<User>('auth/me', {});
        if (userData) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // ログアウト処理
  const logout = async () => {
    try {
      // fetch APIの代わりにfetchData関数を使用
      const response = await fetchData<{ success: boolean }>('auth/logout', {
        method: 'POST',
      });
      
      if (response.success) {
        setUser(null);
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return { user, loading, logout };
} 