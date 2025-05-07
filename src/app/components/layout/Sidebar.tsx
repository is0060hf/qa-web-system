'use client';

import { useState, useEffect } from 'react';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import {
  Box,
  Drawer as MuiDrawer,
  List,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Badge,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Groups as GroupsIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  ExpandLess,
  ExpandMore,
  FactCheck as FactCheckIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Notifications as NotificationsIcon,
  PeopleAlt as PeopleAltIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

interface SidebarProps {
  open: boolean;
  handleDrawerClose: () => void;
}

export default function Sidebar({ open, handleDrawerClose }: SidebarProps) {
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const handleQuestionsClick = () => {
    setQuestionsOpen(!questionsOpen);
  };

  const handleProjectsClick = () => {
    setProjectsOpen(!projectsOpen);
  };

  // 未読通知数を取得
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications?limit=0');
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch unread notifications count:', error);
      }
    };

    fetchUnreadCount();
    
    // 60秒ごとに未読通知をポーリング
    const intervalId = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                bgcolor: pathname === '/dashboard' ? 'action.selected' : 'transparent',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="ダッシュボード" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </Link>
        </ListItem>

        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={handleProjectsClick}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              bgcolor: pathname.startsWith('/projects') ? 'action.selected' : 'transparent',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
              }}
            >
              <GroupsIcon />
            </ListItemIcon>
            <ListItemText primary="プロジェクト" sx={{ opacity: open ? 1 : 0 }} />
            {open && (projectsOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        <Collapse in={open && projectsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <Link href="/projects" style={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton sx={{ pl: 4 }}>
                <ListItemIcon>
                  <FactCheckIcon />
                </ListItemIcon>
                <ListItemText primary="プロジェクト一覧" />
              </ListItemButton>
            </Link>
            <Link href="/projects/create" style={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton sx={{ pl: 4 }}>
                <ListItemIcon>
                  <AddCircleOutlineIcon />
                </ListItemIcon>
                <ListItemText primary="新規プロジェクト" />
              </ListItemButton>
            </Link>
          </List>
        </Collapse>

        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={handleQuestionsClick}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              bgcolor: pathname.startsWith('/questions') ? 'action.selected' : 'transparent',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
              }}
            >
              <QuestionAnswerIcon />
            </ListItemIcon>
            <ListItemText primary="質問管理" sx={{ opacity: open ? 1 : 0 }} />
            {open && (questionsOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        <Collapse in={open && questionsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <Link href="/questions/assigned" style={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton sx={{ pl: 4 }}>
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText primary="担当質問" />
              </ListItemButton>
            </Link>
            <Link href="/questions/created" style={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton sx={{ pl: 4 }}>
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText primary="作成質問" />
              </ListItemButton>
            </Link>
          </List>
        </Collapse>

        {/* 通知一覧へのリンク */}
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Link href="/notifications" style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                bgcolor: pathname === '/notifications' ? 'action.selected' : 'transparent',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </ListItemIcon>
              <ListItemText primary="通知" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </Link>
        </ListItem>

        <ListItem disablePadding sx={{ display: 'block' }}>
          <Link href="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                bgcolor: pathname === '/settings' ? 'action.selected' : 'transparent',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="設定" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </Link>
        </ListItem>

        <ListItem disablePadding sx={{ display: 'block' }}>
          <Link href="/search" style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                bgcolor: pathname === '/search' ? 'action.selected' : 'transparent',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <SearchIcon />
              </ListItemIcon>
              <ListItemText primary="検索" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </Link>
        </ListItem>

        {/* 管理者向けユーザー管理メニュー */}
        {isAdmin && (
          <ListItem disablePadding sx={{ display: 'block' }}>
            <Link href="/admin/users" style={{ textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  bgcolor: pathname === '/admin/users' ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  <PeopleAltIcon />
                </ListItemIcon>
                <ListItemText primary="ユーザー管理" sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </Link>
          </ListItem>
        )}
      </List>
    </Drawer>
  );
} 