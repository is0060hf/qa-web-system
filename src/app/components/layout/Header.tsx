'use client';

import { useState } from 'react';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  QuestionAnswer as QuestionAnswerIcon,
} from '@mui/icons-material';

interface HeaderProps {
  open: boolean;
  handleDrawerOpen: () => void;
}

export default function Header({ open, handleDrawerOpen }: HeaderProps) {
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  
  const isNotificationsMenuOpen = Boolean(anchorElNotifications);
  const isUserMenuOpen = Boolean(anchorElUser);
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
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
            <Badge badgeContent={3} color="error">
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
        <MenuItem>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2">新しい質問が割り当てられました</Typography>
            <Typography variant="body2" color="text.secondary">
              プロジェクトXの質問に回答してください
            </Typography>
            <Typography variant="caption" color="text.secondary">
              1時間前
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2">質問への回答が承認されました</Typography>
            <Typography variant="body2" color="text.secondary">
              プロジェクトYの質問回答が承認されました
            </Typography>
            <Typography variant="caption" color="text.secondary">
              3時間前
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2">質問の期限が近づいています</Typography>
            <Typography variant="body2" color="text.secondary">
              プロジェクトZの質問の回答期限は明日です
            </Typography>
            <Typography variant="caption" color="text.secondary">
              昨日
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleNotificationsClose} sx={{ justifyContent: 'center' }}>
          <Typography color="primary">すべての通知を見る</Typography>
        </MenuItem>
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