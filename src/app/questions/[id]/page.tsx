'use client';

import { useState, useEffect, use } from 'react';
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
import { MockQuestion } from '@/mocks/questions';

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
  } = useDataFetching<MockQuestion | null>(
    () => fetchData<MockQuestion>(`questions/${questionId}`),
    null
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDelete = async () => {
    try {
      // 実際には削除のAPIコールが必要
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
    if (comment.trim()) {
      try {
        // 実際にはコメント送信のAPIコールが必要
        await fetchData(`questions/${questionId}/comments`, {
          method: 'POST',
          body: { content: comment },
        });
        setComment('');
        refetch(); // データを再取得
      } catch (err) {
        console.error('コメント送信エラー:', err);
        // エラー処理
      }
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      // 実際には回答承認のAPIコールが必要
      await fetchData(`questions/${questionId}/answers/${answerId}/accept`, {
        method: 'PATCH',
      });
      refetch(); // データを再取得
    } catch (err) {
      console.error('回答承認エラー:', err);
      // エラー処理
    }
  };

  const getStatusColor = (status: string) => {
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
            <Chip 
              icon={<AccessTimeIcon />}
              label={`期限: ${new Date(question.deadline).toLocaleDateString('ja-JP')}`}
              variant="outlined"
              color={new Date(question.deadline) < new Date() ? 'error' : 'default'}
            />
            <Chip 
              label={question.status} 
              color={getStatusColor(question.status) as any}
            />
            <Chip 
              icon={<PersonIcon />}
              label={`作成者: ${question.createdByName}`}
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              担当者:
            </Typography>
            <AvatarGroup max={3}>
              {question.assignees.map((user) => (
                <Tooltip key={user.id} title={user.name}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.875rem' }}>
                    {user.name.charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {question.tags?.map(tag => (
              <Chip 
                key={tag}
                icon={<TagIcon />}
                label={tag}
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
          <Tab label={`回答 (${question.answers?.length || 0})`} {...a11yProps(1)} />
          <Tab label={`コメント (${question.comments?.length || 0})`} {...a11yProps(2)} />
          <Tab label={`添付ファイル (${question.attachments?.length || 0})`} {...a11yProps(3)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <div dangerouslySetInnerHTML={{ __html: question.description?.replace(/\n/g, '<br />') || '' }} />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ReplyIcon />}
            onClick={() => router.push(`/questions/${questionId}/answer`)}
          >
            回答する
          </Button>
        </Box>
        
        {question.answers && question.answers.length > 0 ? (
          <Stack spacing={3}>
            {question.answers.map((answer) => (
              <Card key={answer.id} elevation={0} sx={{ borderRadius: 2 }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {answer.createdByName.charAt(0)}
                    </Avatar>
                  }
                  title={answer.createdByName}
                  subheader={`回答日: ${new Date(answer.createdAt).toLocaleDateString('ja-JP')}`}
                  action={
                    <Box>
                      {answer.isAccepted ? (
                        <Chip 
                          icon={<CheckIcon />}
                          label="承認済み" 
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleAcceptAnswer(answer.id)}
                          sx={{ mr: 1 }}
                        >
                          承認
                        </Button>
                      )}
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  <div dangerouslySetInnerHTML={{ __html: answer.content.replace(/\n/g, '<br />') }} />
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

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <TextField
            label="コメントを追加"
            multiline
            rows={3}
            value={comment}
            onChange={handleCommentChange}
            fullWidth
            variant="outlined"
            placeholder="質問や補足を入力してください..."
            InputProps={{
              endAdornment: (
                <IconButton 
                  color="primary" 
                  onClick={handleSubmitComment} 
                  disabled={!comment.trim()}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  <SendIcon />
                </IconButton>
              ),
            }}
          />
        </Box>
        
        {question.comments && question.comments.length > 0 ? (
          <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            {question.comments.map((commentItem, index) => (
              <Box key={commentItem.id}>
                <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      {commentItem.createdByName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        sx={{ display: 'inline' }}
                        component="span"
                        variant="subtitle2"
                      >
                        {commentItem.createdByName}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          sx={{ display: 'inline', mb: 1 }}
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {new Date(commentItem.createdAt).toLocaleDateString('ja-JP')}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body1"
                          color="text.primary"
                          sx={{ display: 'block', mt: 1 }}
                        >
                          {commentItem.content}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < question.comments.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary">
              まだコメントがありません。
            </Typography>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<AttachFileIcon />}
            onClick={() => {/* ファイル添付処理 */}}
          >
            ファイルを添付
          </Button>
        </Box>
        
        {question.attachments && question.attachments.length > 0 ? (
          <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            {question.attachments.map((file, index) => (
              <Box key={file.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ py: 2 }}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <AttachFileIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          サイズ: {file.size} • 形式: {file.type}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          アップロード日: {new Date(file.uploadedAt).toLocaleDateString('ja-JP')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < question.attachments.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary">
              添付ファイルはありません。
            </Typography>
          </Paper>
        )}
      </TabPanel>

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
            「{question.title}」を削除すると、すべての回答やコメントも削除されます。この操作は元に戻せません。
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