import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, ProjectRole } from '../components/auth/withRoleCheck';
import { fetchData } from '@/lib/utils/fetchData';

// ユーザーの型定義
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// プロジェクトメンバーの型定義
export interface ProjectMember {
  projectId: string;
  role: ProjectRole;
}

// 認証ストアの状態型定義
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  projectMemberships: ProjectMember[];
  error: string | null;
  
  // アクション
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  fetchProjectMemberships: () => Promise<void>;
  checkProjectRole: (projectId: string, role: ProjectRole) => boolean;
}

// 認証ストアの作成（永続化対応）
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true, // 初期ロード中
      projectMemberships: [],
      error: null,
      
      // ログイン処理
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          
          const data = await fetchData<{ user: User; token: string }>('auth/login', {
            method: 'POST',
            body: { email, password }
          });
          
          set({ 
            user: data.user,
            token: data.token,
            isLoading: false
          });
          
          // プロジェクトメンバーシップを取得
          get().fetchProjectMemberships();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '認証に失敗しました',
            isLoading: false
          });
          throw error;
        }
      },
      
      // ログアウト処理
      logout: () => {
        fetchData<{ success: boolean }>('auth/logout', { method: 'POST' })
          .catch(console.error); // エラーを無視（ベストエフォート）
        
        set({ 
          user: null, 
          token: null,
          projectMemberships: [],
          error: null
        });
      },
      
      // ユーザー登録処理
      register: async (name, email, password) => {
        try {
          set({ isLoading: true, error: null });
          
          await fetchData<{ id: string; email: string }>('auth/register', {
            method: 'POST',
            body: { name, email, password }
          });
          
          // 登録成功後、自動的にログイン
          await get().login(email, password);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'ユーザー登録に失敗しました',
            isLoading: false
          });
          throw error;
        }
      },
      
      // パスワードリセット要求
      requestPasswordReset: async (email) => {
        try {
          set({ isLoading: true, error: null });
          
          await fetchData<{ success: boolean; message: string }>('auth/request-password-reset', {
            method: 'POST',
            body: { email }
          });
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'パスワードリセット要求に失敗しました',
            isLoading: false
          });
          throw error;
        }
      },
      
      // パスワードリセット実行
      resetPassword: async (token, newPassword) => {
        try {
          set({ isLoading: true, error: null });
          
          await fetchData<{ success: boolean; message: string }>('auth/reset-password', {
            method: 'POST',
            body: { token, newPassword }
          });
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'パスワードリセットに失敗しました',
            isLoading: false
          });
          throw error;
        }
      },
      
      // ユーザー情報の更新
      updateUser: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          
          const updatedUserData = await fetchData<User>('users/me', {
            method: 'PATCH',
            body: userData
          });
          
          set(state => ({ 
            user: state.user ? { ...state.user, ...updatedUserData } : null,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'ユーザー情報の更新に失敗しました',
            isLoading: false
          });
          throw error;
        }
      },
      
      // 現在のユーザー情報を取得
      fetchCurrentUser: async () => {
        try {
          set({ isLoading: true });
          
          try {
            const userData = await fetchData<User>('auth/me', {});
            
            set({ 
              user: userData,
              isLoading: false
            });
            
            // プロジェクトメンバーシップを取得
            get().fetchProjectMemberships();
          } catch (error) {
            // 認証エラーの場合はユーザー情報をクリア
            if (error instanceof Error && error.message.includes('401')) {
              set({ user: null, token: null, isLoading: false });
              return;
            }
            throw error;
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'ユーザー情報の取得に失敗しました',
            isLoading: false
          });
        }
      },
      
      // プロジェクトメンバーシップを取得
      fetchProjectMemberships: async () => {
        try {
          const user = get().user;
          if (!user) return; // ユーザーがログインしていない場合は何もしない
          
          const memberships = await fetchData<ProjectMember[]>('users/me/projects', {});
          
          set({ projectMemberships: memberships });
        } catch (error) {
          console.error('プロジェクトメンバーシップの取得エラー:', error);
          // UIにエラーを表示する必要がない場合は状態を更新しない
        }
      },
      
      // プロジェクトロールをチェック
      checkProjectRole: (projectId, requiredRole) => {
        const { user, projectMemberships } = get();
        
        // ADMINは全てのプロジェクトに対して全ての権限を持つ
        if (user?.role === 'ADMIN') return true;
        
        // プロジェクトメンバーシップを確認
        const membership = projectMemberships.find(m => m.projectId === projectId);
        
        if (!membership) return false;
        
        // MANAGERはMEMBERの権限も持つ
        if (requiredRole === 'MEMBER' && membership.role === 'MANAGER') return true;
        
        // 役割が一致するか確認
        return membership.role === requiredRole;
      }
    }),
    {
      name: 'auth-storage', // ローカルストレージのキー
      partialize: (state) => ({ 
        // トークンのみを永続化（セキュリティのため最小限の情報のみ保存）
        token: state.token 
      }),
    }
  )
);

// 初期化処理: アプリ起動時にユーザー情報を取得するためのフック
export function initializeAuth() {
  const { fetchCurrentUser } = useAuthStore.getState();
  fetchCurrentUser();
} 