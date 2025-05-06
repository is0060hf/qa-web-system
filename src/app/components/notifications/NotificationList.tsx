'use client';

import React, { useState } from 'react';
import { 
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Pagination,
  Badge
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  AssignmentLate as AssignmentLateIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  QuestionAnswer as QuestionAnswerIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

// 通知の種類
export enum NotificationType {
  ASSIGNEE_DEADLINE_EXCEEDED = 'ASSIGNEE_DEADLINE_EXCEEDED', // 回答者: 期限超過
  REQUESTER_DEADLINE_EXCEEDED = 'REQUESTER_DEADLINE_EXCEEDED', // 質問者: 期限超過
  NEW_QUESTION_ASSIGNED = 'NEW_QUESTION_ASSIGNED', // 回答者: 新規割当
  NEW_ANSWER_POSTED = 'NEW_ANSWER_POSTED', // 質問者: 新規回答
  ANSWERED_QUESTION_CLOSED = 'ANSWERED_QUESTION_CLOSED' // 回答者: 回答済み質問クローズ
}

// 通知データの型定義
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  relatedId?: string; // 関連するエンティティのID（主に質問ID）
  isRead: boolean;
  createdAt: string; // ISO文字列
}

// 通知一覧のプロパティ
interface NotificationListProps {
  notifications: Notification[];
  total: number;
  currentPage: number;
  pageSize: number;
  unreadCount: number;
  isLoading?: boolean;
  error?: string;
  onPageChange: (page: number) => void;
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onToggleUnreadOnly: (unreadOnly: boolean) => void;
  unreadOnly: boolean;
}

export default function NotificationList({
  notifications,
  total,
  currentPage,
  pageSize,
  unreadCount,
  isLoading = false,
  error,
  onPageChange,
  onNotificationClick,
  onMarkAllAsRead,
  onToggleUnreadOnly,
  unreadOnly
}: NotificationListProps) {
  // 通知タイプに基づいてアイコンを取得
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_QUESTION_ASSIGNED:
        return <AssignmentIcon />;
      case NotificationType.ASSIGNEE_DEADLINE_EXCEEDED:
      case NotificationType.REQUESTER_DEADLINE_EXCEEDED:
        return <AssignmentLateIcon color="error" />;
      case NotificationType.NEW_ANSWER_POSTED:
        return <QuestionAnswerIcon color="primary" />;
      case NotificationType.ANSWERED_QUESTION_CLOSED:
        return <AssignmentTurnedInIcon color="success" />;
      default:
        return <NotificationsIcon />;
    }
  };

  // ページ数の計算
  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            通知一覧
            {unreadCount > 0 && (
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={unreadOnly}
                  onChange={(e) => onToggleUnreadOnly(e.target.checked)}
                  disabled={isLoading}
                />
              }
              label="未読のみ表示"
            />
            
            <Button
              variant="outlined"
              color="primary"
              onClick={onMarkAllAsRead}
              disabled={isLoading || unreadCount === 0}
              sx={{ ml: 2 }}
            >
              すべて既読にする
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="text.secondary">
              {unreadOnly ? '未読の通知はありません' : '通知はありません'}
            </Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected'
                    },
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => onNotificationClick(notification)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: notification.isRead ? 'grey.300' : 'primary.main' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={notification.message}
                    secondary={
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ja
                        })}
                      </Typography>
                    }
                    primaryTypographyProps={{ 
                      fontWeight: notification.isRead ? 'normal' : 'medium' 
                    }}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
        
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, page) => onPageChange(page)}
              disabled={isLoading}
              color="primary"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 