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
          console.log('[AuthStore] login: ログイン処理を開始');
          set({ isLoading: true, error: null });
          
          const data = await fetchData<{ user: User; token: string }>('auth/login', {
            method: 'POST',
            body: { email, password }
          });
          
          console.log('[AuthStore] login: ログイン成功、トークン取得');
          console.log('[AuthStore] login: トークンの長さ:', data.token.length);
          
          // トークンのデコード（デバッグ用）
          try {
            const parts = data.token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              console.log('[AuthStore] login: トークンペイロード:', payload);
              
              if (payload.exp) {
                const now = Math.floor(Date.now() / 1000);
                console.log('[AuthStore] login: 現在時刻 (unix):', now);
                console.log('[AuthStore] login: トークン有効期限 (unix):', payload.exp);
                console.log('[AuthStore] login: 有効期間:', payload.exp - now, '秒');
                
                // 有効期限の日時を表示
                const expiryDate = new Date(payload.exp * 1000);
                console.log('[AuthStore] login: 有効期限日時:', expiryDate.toISOString());
              }
            }
          } catch (e) {
            console.error('[AuthStore] login: トークンのデコードに失敗:', e);
          }
          
          console.log('[AuthStore] login: storeの状態を更新');
          set({ 
            user: data.user,
            token: data.token,
            isLoading: false
          });
          
          // プロジェクトメンバーシップを取得
          console.log('[AuthStore] login: プロジェクトメンバーシップの取得を開始');
          await get().fetchProjectMemberships();
          console.log('[AuthStore] login: ログイン処理完了');
        } catch (error) {
          console.error('[AuthStore] login: ログイン失敗:', error);
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
          console.log('[AuthStore] fetchCurrentUser: ユーザー情報取得開始');
          set({ isLoading: true });
          console.log('[AuthStore] fetchCurrentUser: localStorage確認');
          
          // ローカルストレージの状態確認
          if (typeof window !== 'undefined') {
            const authStorage = localStorage.getItem('auth-storage');
            console.log('[AuthStore] fetchCurrentUser: localStorage内容:', 
                       authStorage ? 'データあり' : 'データなし');
            
            if (authStorage) {
              try {
                const { state } = JSON.parse(authStorage);
                console.log('[AuthStore] fetchCurrentUser: 保存されたトークン:', 
                           state?.token ? '存在します' : '存在しません');
              } catch (e) {
                console.error('[AuthStore] fetchCurrentUser: ストレージの解析エラー:', e);
              }
            }
          }
          
          try {
            console.log('[AuthStore] fetchCurrentUser: /api/auth/me エンドポイントを呼び出し');
            const userData = await fetchData<User | null>('auth/me', {});
            console.log('[AuthStore] fetchCurrentUser: レスポンス:', userData);
            
            // ユーザーデータがnullの場合は未ログイン状態
            if (userData === null) {
              console.log('[AuthStore] fetchCurrentUser: ユーザーデータがnull、認証状態をクリア');
              set({ 
                user: null,
                token: null,
                isLoading: false 
              });
              return;
            }
            
            console.log('[AuthStore] fetchCurrentUser: ユーザーデータあり、storeに設定:', userData.id);
            set({ 
              user: userData,
              isLoading: false
            });
            
            // プロジェクトメンバーシップを取得
            console.log('[AuthStore] fetchCurrentUser: プロジェクトメンバーシップの取得を開始');
            get().fetchProjectMemberships();
          } catch (error) {
            // 認証エラーの場合はユーザー情報をクリア
            console.error('[AuthStore] fetchCurrentUser: 取得エラー:', error);
            if (error instanceof Error && error.message.includes('401')) {
              console.log('[AuthStore] fetchCurrentUser: 401エラー検出、認証状態をクリア');
              set({ user: null, token: null, isLoading: false });
              return;
            }
            throw error;
          }
        } catch (error) {
          console.error('[AuthStore] fetchCurrentUser: 未処理のエラー:', error);
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