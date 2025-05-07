'use client';

import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Tooltip,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  QuestionAnswer as QuestionAnswerIcon,
  AssignmentLate as AssignmentLateIcon,
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

// 通知の種類
enum NotificationType {
  ASSIGNEE_DEADLINE_EXCEEDED = 'ASSIGNEE_DEADLINE_EXCEEDED', // 回答者: 期限超過
  REQUESTER_DEADLINE_EXCEEDED = 'REQUESTER_DEADLINE_EXCEEDED', // 質問者: 期限超過
  NEW_QUESTION_ASSIGNED = 'NEW_QUESTION_ASSIGNED', // 回答者: 新規割当
  NEW_ANSWER_POSTED = 'NEW_ANSWER_POSTED', // 質問者: 新規回答
  ANSWERED_QUESTION_CLOSED = 'ANSWERED_QUESTION_CLOSED' // 回答者: 回答済み質問クローズ
}

// 通知データの型定義
interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  relatedId?: string; // 関連するエンティティのID（主に質問ID）
  isRead: boolean;
  createdAt: string; // ISO文字列
}

interface HeaderProps {
  open: boolean;
  handleDrawerOpen: () => void;
}

export default function Header({ open, handleDrawerOpen }: HeaderProps) {
  const router = useRouter();
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const isNotificationsMenuOpen = Boolean(anchorElNotifications);
  const isUserMenuOpen = Boolean(anchorElUser);
  
  // 通知一覧を取得
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=5&unreadOnly=true');
      if (!response.ok) {
        throw new Error('通知の取得に失敗しました');
      }
      
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 通知を既読にする
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('既読処理に失敗しました');
      }
      
      // 既読状態を更新
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      
      // 未読カウントを減らす
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // すべての通知を既読にする
  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('既読処理に失敗しました');
      }
      
      // 通知を再取得
      fetchNotifications();
      
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      setIsLoading(false);
    }
  };

  // 通知クリック時の処理
  const handleNotificationClick = async (notification: Notification) => {
    // 既読にする
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // 通知メニューを閉じる
    handleNotificationsClose();
    
    // 関連ページへ遷移
    if (notification.relatedId) {
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
          targetUrl = '/dashboard';
      }
      
      router.push(targetUrl);
    }
  };
  
  // 通知タイプに応じたアイコンを取得
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_QUESTION_ASSIGNED:
        return <AssignmentIcon fontSize="small" />;
      case NotificationType.ASSIGNEE_DEADLINE_EXCEEDED:
      case NotificationType.REQUESTER_DEADLINE_EXCEEDED:
        return <AssignmentLateIcon fontSize="small" color="error" />;
      case NotificationType.NEW_ANSWER_POSTED:
        return <QuestionAnswerIcon fontSize="small" color="primary" />;
      case NotificationType.ANSWERED_QUESTION_CLOSED:
        return <AssignmentTurnedInIcon fontSize="small" color="success" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
    fetchNotifications();
  };
  
  const handleNotificationsClose = () => {
    setAnchorElNotifications(null);
  };
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setAnchorElUser(null);
  };

  const handleViewAllNotifications = () => {
    handleNotificationsClose();
    router.push('/notifications');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerOpen}
          edge="start"
          sx={{ mr: 2, ...(open && { display: 'none' }) }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <QuestionAnswerIcon sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap component="div">
            質問管理Webシステム
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex' }}>
          <IconButton
            size="large"
            aria-label="show new notifications"
            color="inherit"
            onClick={handleNotificationsOpen}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <Tooltip title="アカウント設定">
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleUserMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>U</Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      
      {/* 通知メニュー */}
      <Menu
        anchorEl={anchorElNotifications}
        id="notifications-menu"
        keepMounted
        open={isNotificationsMenuOpen}
        onClose={handleNotificationsClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 320,
            maxHeight: 400,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              未読の通知はありません
            </Typography>
          </Box>
        ) : (
          <>
            {notifications.map((notification) => (
              <div key={notification.id}>
                <MenuItem onClick={() => handleNotificationClick(notification)}>
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <Box sx={{ mr: 1.5, mt: 0.5 }}>
                      {getNotificationIcon(notification.type)}
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 'normal' : 'medium' }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ja
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <Divider />
              </div>
            ))}
          </>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5 }}>
          <Button 
            size="small" 
            onClick={markAllAsRead}
            disabled={isLoading || unreadCount === 0}
          >
            すべて既読にする
          </Button>
          <Button 
            size="small" 
            color="primary" 
            onClick={handleViewAllNotifications}
          >
            通知一覧へ
          </Button>
        </Box>
      </Menu>
      
      {/* ユーザーメニュー */}
      <Menu
        anchorEl={anchorElUser}
        id="user-menu"
        keepMounted
        open={isUserMenuOpen}
        onClose={handleUserMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleUserMenuClose}>
          <AccountCircle sx={{ mr: 2 }} /> プロフィール
        </MenuItem>
        <MenuItem onClick={handleUserMenuClose}>
          <SettingsIcon sx={{ mr: 2 }} /> 設定
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleUserMenuClose}>
          <LogoutIcon sx={{ mr: 2 }} /> ログアウト
        </MenuItem>
      </Menu>
    </AppBar>
  );
} 