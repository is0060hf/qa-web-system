'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Share as ShareIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Assignment as AssignmentIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { fetchData } from '@/lib/utils/fetchData';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `project-tab-${index}`,
    'aria-controls': `project-tabpanel-${index}`,
  };
}

// プロジェクトの型定義
interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
}

interface Question {
  id: string;
  title: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

interface ProjectDetails {
  id: string;
  name: string;
  description: string;
  members: ProjectMember[];
  questions?: Question[];
  status: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // プロジェクト詳細データを取得
  // Note: 将来のNext.jsバージョンではparamsの処理方法が変わる可能性があります
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setIsLoading(true);
        // パラメータから直接IDを使用
        const projectId = params.id;
        const data = await fetchData<ProjectDetails>(`projects/${projectId}`, {});
        setProject(data);
      } catch (err) {
        console.error('Failed to fetch project data:', err);
        setError(err instanceof Error ? err.message : 'プロジェクト情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [params.id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDelete = async () => {
    try {
      await fetchData<{ success: boolean }>(`projects/${params.id}`, {
        method: 'DELETE'
      });
      setOpenDeleteDialog(false);
      router.push('/projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError(err instanceof Error ? err.message : 'プロジェクトの削除に失敗しました');
      setOpenDeleteDialog(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'アクティブ':
        return 'success';
      case '一時停止':
        return 'warning';
      case '完了':
        return 'info';
      default:
        return 'default';
    }
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case '回答中':
      case 'IN_PROGRESS':
        return 'primary';
      case '承認待ち':
      case 'PENDING_APPROVAL':
        return 'warning';
      case 'クローズ':
      case 'CLOSED':
        return 'success';
      case 'NEW':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'プロジェクト情報を取得できませんでした'}
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/projects')}>
          プロジェクト一覧に戻る
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {project.name}
          </Typography>
          <Chip 
            label={project.status} 
            color={getStatusColor(project.status) as any}
            sx={{ mr: 1 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            最終更新日: {new Date(project.updatedAt).toLocaleDateString('ja-JP')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={() => {/* メンバー追加処理 */}}
          >
            メンバー追加
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={() => {/* 共有処理 */}}
          >
            共有
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/projects/${params.id}/edit`)}
          >
            編集
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setOpenDeleteDialog(true)}
          >
            削除
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 4, p: 3, borderRadius: 2 }}>
        <Typography variant="body1" paragraph>
          {project.description}
        </Typography>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="project tabs">
          <Tab label="概要" {...a11yProps(0)} />
          <Tab label="メンバー" {...a11yProps(1)} />
          <Tab label="質問" {...a11yProps(2)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 2 }}>
              <CardHeader title="プロジェクト情報" />
              <Divider />
              <CardContent>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ width: 150 }}>プロジェクトID:</Typography>
                  <Typography variant="body2">{project.id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ width: 150 }}>作成日:</Typography>
                  <Typography variant="body2">{new Date(project.createdAt).toLocaleDateString('ja-JP')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ width: 150 }}>メンバー数:</Typography>
                  <Typography variant="body2">{project.memberCount || project.members.length}人</Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ width: 150 }}>質問数:</Typography>
                  <Typography variant="body2">{project.questions?.length || 0}件</Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ width: 150 }}>ステータス:</Typography>
                  <Chip 
                    label={project.status} 
                    color={getStatusColor(project.status) as any}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 2 }}>
              <CardHeader 
                title="最近の質問" 
                action={
                  <Button 
                    variant="text" 
                    color="primary"
                    onClick={() => router.push(`/questions/create?projectId=${params.id}`)}
                    startIcon={<HelpOutlineIcon />}
                  >
                    質問を作成
                  </Button>
                }
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List>
                  {project.questions && project.questions.length > 0 ? (
                    project.questions.slice(0, 3).map((question, index) => (
                      <Box key={question.id}>
                        <ListItem
                          button
                          onClick={() => router.push(`/questions/${question.id}`)}
                          sx={{ px: 3, py: 2 }}
                          secondaryAction={
                            <Chip 
                              label={question.status} 
                              color={getQuestionStatusColor(question.status) as any}
                              size="small"
                            />
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <AssignmentIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={question.title}
                            secondary={`作成日: ${new Date(question.createdAt).toLocaleDateString('ja-JP')}`}
                          />
                        </ListItem>
                        {index < Math.min(project.questions.length - 1, 2) && <Divider variant="inset" component="li" />}
                      </Box>
                    ))
                  ) : (
                    <ListItem sx={{ px: 3, py: 2 }}>
                      <ListItemText primary="質問がありません" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => {/* メンバー追加処理 */}}
          >
            メンバー追加
          </Button>
        </Box>
        <Paper elevation={0} sx={{ borderRadius: 2 }}>
          <List>
            {project.members.length > 0 ? (
              project.members.map((member, index) => (
                <Box key={member.id}>
                  <ListItem
                    sx={{ px: 3, py: 2 }}
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete">
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {/* ユーザー名が存在する場合のみ最初の文字を表示、そうでなければ代替テキスト */}
                        {member.userName ? member.userName.charAt(0) : (member.userEmail ? member.userEmail.charAt(0) : 'U')}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.userName || member.userEmail || `メンバーID: ${member.userId}`}
                      secondary={member.role}
                    />
                  </ListItem>
                  {index < project.members.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))
            ) : (
              <ListItem sx={{ px: 3, py: 2 }}>
                <ListItemText primary="メンバーがいません" />
              </ListItem>
            )}
          </List>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<HelpOutlineIcon />}
            onClick={() => router.push(`/questions/create?projectId=${params.id}`)}
          >
            質問を作成
          </Button>
        </Box>
        <Paper elevation={0} sx={{ borderRadius: 2 }}>
          <List>
            {project.questions && project.questions.length > 0 ? (
              project.questions.map((question, index) => (
                <Box key={question.id}>
                  <ListItem
                    button
                    onClick={() => router.push(`/questions/${question.id}`)}
                    sx={{ px: 3, py: 2 }}
                    secondaryAction={
                      <Chip 
                        label={question.status} 
                        color={getQuestionStatusColor(question.status) as any}
                        size="small"
                      />
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <AssignmentIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={question.title}
                      secondary={`作成日: ${new Date(question.createdAt).toLocaleDateString('ja-JP')}`}
                    />
                  </ListItem>
                  {index < project.questions.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))
            ) : (
              <ListItem sx={{ px: 3, py: 2 }}>
                <ListItemText primary="質問がありません" />
              </ListItem>
            )}
          </List>
        </Paper>
      </TabPanel>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          プロジェクトを削除しますか？
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            「{project.name}」を削除すると、すべての質問や関連データも削除されます。この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>キャンセル</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
} 