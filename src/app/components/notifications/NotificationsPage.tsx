'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container,
  Box,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import NotificationList, { Notification, NotificationType } from './NotificationList';
import { fetchData } from '@/lib/utils/fetchData';

// APIから取得する通知データの型
interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
}

export default function NotificationsPage() {
  // 通知データと状態
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [unreadOnly, setUnreadOnly] = useState(false);
  
  // ローディングと通信状態
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 通知データを取得
  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 直接fetchではなく、fetchData関数を使用
      const data = await fetchData<NotificationsResponse>('notifications', {
        params: {
          page: currentPage.toString(),
          limit: pageSize.toString(),
          ...(unreadOnly && { unreadOnly: 'true' })
        }
      });
      
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setTotal(data.total);
      
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err instanceof Error ? err.message : '通知の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ページ変更時に通知を再取得
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 未読のみ表示の切り替え
  const handleToggleUnreadOnly = (value: boolean) => {
    setUnreadOnly(value);
    setCurrentPage(1); // 1ページ目に戻る
  };

  // すべて既読にする
  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    
    try {
      // 直接fetchではなく、fetchData関数を使用
      const response = await fetchData<{ success: boolean; updatedCount: number }>('notifications/read-all', {
        method: 'POST'
      });
      
      // 成功したら通知を再取得
      fetchNotifications();
      
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setError(err instanceof Error ? err.message : '既読処理に失敗しました');
      setIsLoading(false);
    }
  };

  // 通知をクリックしたときの処理
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        // 直接fetchではなく、fetchData関数を使用
        await fetchData<{ success: boolean; id: string }>(`notifications/${notification.id}/read`, {
          method: 'PATCH'
        });
        
        // 既読状態を更新（APIから再取得しない場合）
        setNotifications(prevNotifications => 
          prevNotifications.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        
        // 未読カウントを減らす
        if (!notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        // エラーは表示しない（UXを損なわないため）
      }
    }
    
    // 関連ページへの遷移
    if (notification.relatedId) {
      // 通知タイプに応じて適切なURLへ遷移
      let targetUrl = '/';
      
      switch (notification.type) {
        case NotificationType.NEW_QUESTION_ASSIGNED:
        case NotificationType.ASSIGNEE_DEADLINE_EXCEEDED:
        case NotificationType.REQUESTER_DEADLINE_EXCEEDED:
        case NotificationType.NEW_ANSWER_POSTED:
        case NotificationType.ANSWERED_QUESTION_CLOSED:
          targetUrl = `/questions/${notification.relatedId}`;
          break;
        default:
          // デフォルトはダッシュボードなど
          targetUrl = '/dashboard';
      }
      
      window.location.href = targetUrl;
    }
  };

  // ページ変更時や未読のみ表示の切り替え時に通知を再取得
  useEffect(() => {
    fetchNotifications();
  }, [currentPage, unreadOnly]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <NotificationList
        notifications={notifications}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        unreadCount={unreadCount}
        isLoading={isLoading}
        error={error || undefined}
        onPageChange={handlePageChange}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={handleMarkAllAsRead}
        onToggleUnreadOnly={handleToggleUnreadOnly}
        unreadOnly={unreadOnly}
      />
    </Container>
  );
} 