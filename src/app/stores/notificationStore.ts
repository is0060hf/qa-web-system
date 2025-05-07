import { create } from 'zustand';
import { fetchData } from '@/lib/utils/fetchData';

// 通知の型定義
export interface Notification {
  id: string;
  type: string;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

// 通知ストアの状態型定義
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  fetchNotifications: (unreadOnly?: boolean, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

// 通知ストアの作成
export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  
  // 通知一覧を取得
  fetchNotifications: async (unreadOnly = false, limit = 20) => {
    try {
      set({ isLoading: true, error: null });
      
      const params: Record<string, string> = {};
      if (unreadOnly) params.unreadOnly = 'true';
      if (limit) params.limit = limit.toString();
      
      const data = await fetchData<{
        notifications: Notification[];
        unreadCount: number;
      }>('notifications', { params });
      
      set({ 
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '通知の取得に失敗しました',
        isLoading: false
      });
    }
  },
  
  // 特定の通知を既読にする
  markAsRead: async (notificationId: string) => {
    try {
      await fetchData<{ success: boolean }>(`notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      // 状態を更新
      set(state => ({
        notifications: state.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('通知の既読処理エラー:', error);
      // UIにエラーを表示する必要がない場合は状態を更新しない
    }
  },
  
  // 全ての通知を既読にする
  markAllAsRead: async () => {
    try {
      await fetchData<{ success: boolean }>('notifications/read-all', {
        method: 'POST'
      });
      
      // 状態を更新
      set(state => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('全通知の既読処理エラー:', error);
      // UIにエラーを表示する必要がない場合は状態を更新しない
    }
  },
  
  // 未読通知数を更新
  refreshUnreadCount: async () => {
    try {
      const data = await fetchData<{ unreadCount: number }>('notifications', {
        params: { limit: '0' }
      });
      
      set({ unreadCount: data.unreadCount });
    } catch (error) {
      console.error('未読通知数の取得エラー:', error);
      // UIにエラーを表示する必要がない場合は状態を更新しない
    }
  }
})); 