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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
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
  Comment as CommentIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { fetchData, useDataFetching } from '@/lib/utils/fetchData';
import MarkdownViewer from '@/components/common/MarkdownViewer';
import { useAuth } from '@/app/hooks/useAuth';
import { getStatusChipColor } from '@/lib/utils/muiHelpers';
import { getStatusLabel, getPriorityLabel } from '@/lib/utils/statusHelpers';
import { useToast } from '@/hooks/useToast';

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

interface Thread {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
    profileImage?: {
      id: string;
      storageUrl: string;
    } | null;
  };
}

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  
  // React.use() を使用して params をアンラップ
  const resolvedParams = use(params);
  const questionId = resolvedParams.id;
  
  const [tabValue, setTabValue] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [threads, setThreads] = useState<Record<string, Thread[]>>({});
  const [activeAnswerId, setActiveAnswerId] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  // 回答権限と確認権限のチェック
  const canAnswer = question && user && question.assignee.id === user.id;
  const canConfirm = question && user && (
    question.creator.id === user.id || 
    question.assignee.id === user.id ||
    user.role === 'ADMIN'
  );
  const isCreator = question && user && question.creator.id === user.id;

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

  const handleSubmitComment = async (answerId: string) => {
    if (!comment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetchData<Thread>(
        `questions/${questionId}/answers/${answerId}/threads`,
        {
          method: 'POST',
          body: { content: comment },
        }
      );

      // スレッドリストを更新
      setThreads(prev => ({
        ...prev,
        [answerId]: [...(prev[answerId] || []), response],
      }));
      setComment('');
    } catch (error) {
      console.error('コメント投稿エラー:', error);
      toast.showError('コメントの投稿に失敗しました');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAcceptAnswer = async () => {
    if (!canConfirm) return;

    setIsUpdatingStatus(true);
    try {
      await fetchData(`questions/${questionId}/status`, {
        method: 'PATCH',
        body: { status: 'CLOSED' },
      });
      
      // データを再取得
      refetch();
      toast.showSuccess('質問を完了としてマークしました');
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      toast.showError('ステータスの更新に失敗しました');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStatusChange = async (event: SelectChangeEvent<string>) => {
    if (!isCreator) return;

    const newStatus = event.target.value;
    setIsUpdatingStatus(true);
    try {
      await fetchData(`questions/${questionId}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      
      // データを再取得
      refetch();
      toast.showSuccess('ステータスを更新しました');
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      toast.showError('ステータスの更新に失敗しました');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // スレッドの取得
  const fetchThreads = async (answerId: string) => {
    try {
      const response = await fetchData<Thread[]>(
        `questions/${questionId}/answers/${answerId}/threads`
      );
      setThreads(prev => ({
        ...prev,
        [answerId]: response,
      }));
      return response;
    } catch (error) {
      console.error('スレッド取得エラー:', error);
      return [];
    }
  };

  // 初期表示時に全ての回答のスレッドを取得し、コメントがある回答のアコーディオンを開く
  useEffect(() => {
    if (question?.answers) {
      const fetchAllThreads = async () => {
        const threadPromises = question.answers.map(async (answer) => {
          const threads = await fetchThreads(answer.id);
          return { answerId: answer.id, threads };
        });
        
        const results = await Promise.all(threadPromises);
        const firstAnswerWithComments = results.find(result => result.threads.length > 0);
        
        if (firstAnswerWithComments) {
          setActiveAnswerId(firstAnswerWithComments.answerId);
        }
      };
      
      fetchAllThreads();
    }
  }, [question?.answers]);

  // 回答のスレッドを展開
  const toggleThreads = (answerId: string) => {
    if (activeAnswerId === answerId) {
      setActiveAnswerId(null);
    } else {
      setActiveAnswerId(answerId);
      if (!threads[answerId]) {
        fetchThreads(answerId);
      }
    }
  };

  const getStatusColor = (status: string) => {
    return getStatusChipColor(status);
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
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {isCreator ? (
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>ステータス</InputLabel>
              <Select
                value={question.status}
                label="ステータス"
                onChange={handleStatusChange}
                disabled={isUpdatingStatus}
                size="small"
              >
                <MenuItem value="OPEN">新規</MenuItem>
                <MenuItem value="IN_PROGRESS">回答中</MenuItem>
                <MenuItem value="PENDING_APPROVAL">確認待ち</MenuItem>
                <MenuItem value="CLOSED">完了</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <>
              {question.answers.length > 0 && question.status === 'PENDING_APPROVAL' && canConfirm ? (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleAcceptAnswer}
                  disabled={isUpdatingStatus}
                >
                  回答を確認して完了にする
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<ReplyIcon />}
                  onClick={() => router.push(`/questions/${questionId}/answer`)}
                  disabled={!canAnswer || question.status === 'CLOSED'}
                  title={
                    !canAnswer ? '担当者のみが回答できます' : 
                    question.status === 'CLOSED' ? '完了した質問には回答できません' : ''
                  }
                >
                  回答する
                </Button>
              )}
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/questions/edit/${questionId}`)}
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
            disabled={!canAnswer || question.status === 'CLOSED'}
            title={
              !canAnswer ? '担当者のみが回答できます' : 
              question.status === 'CLOSED' ? '完了した質問には回答できません' : ''
            }
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
                  action={
                    <IconButton
                      onClick={() => toggleThreads(answer.id)}
                      color={activeAnswerId === answer.id ? 'primary' : 'default'}
                    >
                      <CommentIcon />
                    </IconButton>
                  }
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
                
                {/* スレッド表示 */}
                {activeAnswerId === answer.id && (
                  <>
                    <Divider />
                    <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        コメント
                      </Typography>
                      
                      {threads[answer.id]?.length > 0 ? (
                        <Stack spacing={2} sx={{ mb: 2 }}>
                          {threads[answer.id].map((thread) => (
                            <Box key={thread.id} sx={{ display: 'flex', gap: 1 }}>
                              <Avatar
                                sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
                                src={thread.creator.profileImage?.storageUrl}
                              >
                                {thread.creator.name.charAt(0)}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {thread.creator.name}
                                </Typography>
                                <Typography variant="body2">
                                  {thread.content}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(thread.createdAt).toLocaleString('ja-JP')}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          コメントはまだありません
                        </Typography>
                      )}
                      
                      {/* コメント投稿フォーム */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="コメントを入力..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          disabled={isSubmittingComment || question.status === 'CLOSED'}
                        />
                        <IconButton
                          color="primary"
                          onClick={() => handleSubmitComment(answer.id)}
                          disabled={!comment.trim() || isSubmittingComment || question.status === 'CLOSED'}
                        >
                          <SendIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                )}
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