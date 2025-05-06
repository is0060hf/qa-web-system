'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

// モックデータ
const mockProject = {
  id: 'proj1',
  name: 'プロジェクトA',
  description: 'ウェブアプリケーションの開発プロジェクト。新規機能の開発と既存機能の改善を行います。バグ修正や技術的な質問もこちらで対応します。',
  members: [
    { id: 'user1', name: '鈴木 一郎', role: 'プロジェクトマネージャー', avatar: '' },
    { id: 'user2', name: '佐藤 二郎', role: 'フロントエンドエンジニア', avatar: '' },
    { id: 'user3', name: '田中 三郎', role: 'バックエンドエンジニア', avatar: '' },
    { id: 'user4', name: '高橋 四郎', role: 'デザイナー', avatar: '' },
    { id: 'user5', name: '伊藤 五郎', role: 'QAエンジニア', avatar: '' },
  ],
  questions: [
    { id: 'q1', title: 'ログイン機能の実装について', status: '回答中', createdBy: 'user2', createdAt: '2023-07-25' },
    { id: 'q2', title: 'APIのレスポンス形式の統一', status: '承認待ち', createdBy: 'user3', createdAt: '2023-07-28' },
    { id: 'q3', title: 'デザインガイドラインの適用方法', status: 'クローズ', createdBy: 'user4', createdAt: '2023-07-20' },
    { id: 'q4', title: 'テストケースの追加について', status: '回答中', createdBy: 'user5', createdAt: '2023-08-01' },
  ],
  status: 'アクティブ',
  createdAt: '2023-06-15',
  updatedAt: '2023-08-01',
};

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDelete = () => {
    // 実際には削除のAPIコールが必要
    setOpenDeleteDialog(false);
    router.push('/projects');
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
        return 'primary';
      case '承認待ち':
        return 'warning';
      case 'クローズ':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {mockProject.name}
          </Typography>
          <Chip 
            label={mockProject.status} 
            color={getStatusColor(mockProject.status) as any}
            sx={{ mr: 1 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            最終更新日: {new Date(mockProject.updatedAt).toLocaleDateString('ja-JP')}
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
          {mockProject.description}
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
                  <Typography variant="body2">{mockProject.id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ width: 150 }}>作成日:</Typography>
                  <Typography variant="body2">{new Date(mockProject.createdAt).toLocaleDateString('ja-JP')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ width: 150 }}>メンバー数:</Typography>
                  <Typography variant="body2">{mockProject.members.length}人</Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ width: 150 }}>質問数:</Typography>
                  <Typography variant="body2">{mockProject.questions.length}件</Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ width: 150 }}>ステータス:</Typography>
                  <Chip 
                    label={mockProject.status} 
                    color={getStatusColor(mockProject.status) as any}
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
                  {mockProject.questions.slice(0, 3).map((question, index) => (
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
                      {index < 2 && <Divider variant="inset" component="li" />}
                    </Box>
                  ))}
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
            {mockProject.members.map((member, index) => (
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
                    <Avatar>{member.name.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={member.role}
                  />
                </ListItem>
                {index < mockProject.members.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
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
            {mockProject.questions.map((question, index) => (
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
                {index < mockProject.questions.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
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
            「{mockProject.name}」を削除すると、すべての質問や関連データも削除されます。この操作は元に戻せません。
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