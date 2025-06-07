'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Chip,
  Paper,

  Button,
  Tabs,
  Tab,
  TextField,
  Avatar,
  Divider,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
  AvatarGroup,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { fetchData, useDataFetching } from '@/lib/utils/fetchData';
import MarkdownViewer from '@/components/common/MarkdownViewer';
import { useAuth } from '@/app/hooks/useAuth';
import { getStatusChipColor } from '@/lib/utils/muiHelpers';

// 実際のAPIレスポンスに合わせた型定義
interface QuestionDetail {
  id: string;
  title: string;
  content: string;
  status: string;
  priority: string;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    description: string | null;
  };
  creator: {
    id: string;
    name: string;
    email: string;
    profileImage?: {
      id: string;
      storageUrl: string;
    } | null;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
    profileImage?: {
      id: string;
      storageUrl: string;
    } | null;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  answerForm: {
    id: string;
    fields: Array<{
      id: string;
      label: string;
      fieldType: string;
      options: string[];
      isRequired: boolean;
      order: number;
    }>;
  } | null;
  answers: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      profileImage?: {
        id: string;
        storageUrl: string;
      } | null;
    };
    formResponses: Array<{
      id: string;
      formFieldId: string;
      formFieldLabel: string;
      value: string | null;
      mediaFileId: string | null;
    }>;
    attachments: Array<{
      id: string;
      fileName: string;
      fileSize: number;
      fileType: string;
      storageUrl: string;
      createdAt: string;
    }>;
  }>;
}

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
      id={`question-tabpanel-${index}`}
      aria-labelledby={`question-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `question-tab-${index}`,
    'aria-controls': `question-tabpanel-${index}`,
  };
}

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  
  // React.use() を使用して params をアンラップ
  const resolvedParams = use(params);
  const questionId = resolvedParams.id;
  
  const [tabValue, setTabValue] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [comment, setComment] = useState('');

  // 質問データの取得
  const { 
    data: question, 
    isLoading, 
    error, 
    refetch 
  } = useDataFetching<QuestionDetail | null>(
    () => fetchData<QuestionDetail>(`questions/${questionId}`),
    null
  );

  // 回答権限のチェック
  const canAnswer = question && user && question.assignee.id === user.id;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDelete = async () => {
    try {
      await fetchData(`questions/${questionId}`, { method: 'DELETE' });
      setOpenDeleteDialog(false);
      router.push('/questions');
    } catch (err) {
      console.error('質問削除エラー:', err);
      // エラー処理
    }
  };

  const handleCommentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComment(event.target.value);
  };

  const handleSubmitComment = async () => {
    // 現在のスキーマではコメント機能は実装されていません
    console.log('コメント機能は後で実装します');
  };

  const handleAcceptAnswer = async (answerId: string) => {
    // 承認機能は後で実装します
    console.log('承認機能は後で実装します');
  };

  const getStatusColor = (status: string) => {
    return getStatusChipColor(status);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return '回答中';
      case 'PENDING_APPROVAL':
        return '承認待ち';
      case 'CLOSED':
        return 'クローズ';
      case 'NEW':
        return '新規';
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGHEST':
        return '最高';
      case 'HIGH':
        return '高';
      case 'MEDIUM':
        return '中';
      case 'LOW':
        return '低';
      default:
        return priority;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/questions')}>
          質問一覧に戻る
        </Button>
      </DashboardLayout>
    );
  }

  if (!question) {
    return (
      <DashboardLayout>
        <Alert severity="warning" sx={{ mb: 4 }}>
          質問が見つかりませんでした
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/questions')}>
          質問一覧に戻る
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {question.title}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            {question.deadline && (
              <Chip 
                icon={<AccessTimeIcon />}
                label={`期限: ${new Date(question.deadline).toLocaleDateString('ja-JP')}`}
                variant="outlined"
                color={new Date(question.deadline) < new Date() ? 'error' : 'default'}
              />
            )}
            <Chip 
              label={getStatusLabel(question.status)} 
              color={getStatusColor(question.status)}
            />
            <Chip 
              label={`優先度: ${getPriorityLabel(question.priority)}`}
              variant="outlined"
            />
            <Chip 
              icon={<PersonIcon />}
              label={`作成者: ${question.creator.name}`}
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              担当者:
            </Typography>
            <Tooltip title={question.assignee.name}>
              <Avatar 
                sx={{ width: 28, height: 28, fontSize: '0.875rem' }}
                src={question.assignee.profileImage?.storageUrl}
              >
                {question.assignee.name.charAt(0)}
              </Avatar>
            </Tooltip>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {question.assignee.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              プロジェクト:
            </Typography>
            <Typography variant="body2">
              {question.project.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {question.tags.map(tag => (
              <Chip 
                key={tag.id}
                icon={<TagIcon />}
                label={tag.name}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<ReplyIcon />}
            onClick={() => router.push(`/questions/${questionId}/answer`)}
            disabled={!canAnswer}
            title={!canAnswer ? '担当者のみが回答できます' : ''}
          >
            回答する
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/questions/${questionId}/edit`)}
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="question tabs">
          <Tab label="質問内容" {...a11yProps(0)} />
          <Tab label={`回答 (${question.answers.length})`} {...a11yProps(1)} />
          {question.answerForm && <Tab label="回答フォーム" {...a11yProps(2)} />}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <MarkdownViewer content={question.content} />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ReplyIcon />}
            onClick={() => router.push(`/questions/${questionId}/answer`)}
            disabled={!canAnswer}
            title={!canAnswer ? '担当者のみが回答できます' : ''}
          >
            回答する
          </Button>
        </Box>
        
        {question.answers.length > 0 ? (
          <Stack spacing={3}>
            {question.answers.map((answer) => (
              <Card key={answer.id} elevation={0} sx={{ borderRadius: 2 }}>
                <CardHeader
                  avatar={
                    <Avatar 
                      sx={{ bgcolor: 'primary.main' }}
                      src={answer.user.profileImage?.storageUrl}
                    >
                      {answer.user.name.charAt(0)}
                    </Avatar>
                  }
                  title={answer.user.name}
                  subheader={`回答日: ${new Date(answer.createdAt).toLocaleDateString('ja-JP')}`}
                />
                <Divider />
                <CardContent>
                  <MarkdownViewer content={answer.content} />
                  
                  {answer.formResponses.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        フォーム回答:
                      </Typography>
                      {answer.formResponses.map((response) => (
                        <Box key={response.id} sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {response.formFieldLabel}:
                          </Typography>
                          <Typography variant="body2">
                            {response.value || 'なし'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  {answer.attachments.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        添付ファイル:
                      </Typography>
                      {answer.attachments.map((file) => (
                        <Chip
                          key={file.id}
                          icon={<AttachFileIcon />}
                          label={file.fileName}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          onClick={() => window.open(file.storageUrl, '_blank')}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary">
              まだ回答がありません。
            </Typography>
          </Paper>
        )}
      </TabPanel>

      {question.answerForm && (
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              回答フォーム項目
            </Typography>
            <List>
              {question.answerForm.fields.map((field) => (
                <ListItem key={field.id}>
                  <ListItemText
                    primary={field.label}
                    secondary={`タイプ: ${field.fieldType}${field.isRequired ? ' (必須)' : ''}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </TabPanel>
      )}

      {/* 削除確認ダイアログ */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          質問を削除しますか？
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            「{question.title}」を削除すると、すべての回答も削除されます。この操作は元に戻せません。
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