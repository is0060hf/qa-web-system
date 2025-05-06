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

// モックデータ
const mockQuestion = {
  id: 'q1',
  title: 'ログイン機能の実装について',
  description: `
# ログイン機能の実装について

現在、ログイン機能の実装を担当しておりますが、以下の点について確認させてください。

## 実装予定の内容
1. メールアドレスとパスワードによる認証
2. ソーシャルログイン（Google、Githubを予定）
3. トークンベースの認証（JWT）

## 質問内容
- トークンの有効期限は何時間が適切でしょうか？
- リフレッシュトークンの実装は必要でしょうか？
- パスワードのハッシュ化には何を使うべきでしょうか？（bcryptを検討中）
- 2要素認証の導入予定はありますか？

よろしくお願いいたします。
  `,
  project: 'プロジェクトA',
  project_id: 'proj1',
  status: '回答中',
  priority: '高',
  assignees: [
    { id: 'user1', name: '鈴木 一郎', role: 'プロジェクトマネージャー', avatar: '' },
    { id: 'user2', name: '佐藤 二郎', role: 'フロントエンドエンジニア', avatar: '' },
  ],
  createdBy: 'user3',
  createdByName: '田中 三郎',
  deadline: '2023-08-15',
  createdAt: '2023-07-25',
  updatedAt: '2023-08-01',
  tags: ['認証', 'セキュリティ', 'API'],
  answers: [
    {
      id: 'a1',
      content: `
# ログイン機能についての回答

ご質問いただきありがとうございます。以下、回答いたします。

## トークンの有効期限
通常、JWTの有効期限は用途によって異なりますが：
- アクセストークン: 15分〜1時間が一般的
- リフレッシュトークン: 1日〜2週間が一般的

ユーザー体験とセキュリティのバランスを考えると、アクセストークンは1時間、リフレッシュトークンは2週間が良いでしょう。

## リフレッシュトークンの実装
はい、実装をお勧めします。短い有効期限のアクセストークンとより長い有効期限のリフレッシュトークンの組み合わせが最も安全です。

## パスワードのハッシュ化
bcryptは良い選択です。以下の理由でお勧めします：
- 意図的に遅い処理速度でブルートフォース攻撃に強い
- ソルトが組み込まれている
- 広く使われており、十分に検証されている

## 2要素認証
セキュリティ要件が高い場合は導入をお勧めします。以下の選択肢があります：
- SMS
- 認証アプリ（Google Authenticatorなど）
- メール

認証アプリが最も安全でおすすめです。

実装についてさらにご質問があればお知らせください。
      `,
      createdBy: 'user1',
      createdByName: '鈴木 一郎',
      createdAt: '2023-07-27',
      updatedAt: '2023-07-27',
      isAccepted: false,
    },
  ],
  comments: [
    {
      id: 'c1',
      content: 'トークンの有効期限については、開発段階では長めに設定しても良いかもしれません。本番環境では短くすることを推奨します。',
      createdBy: 'user2',
      createdByName: '佐藤 二郎',
      createdAt: '2023-07-26',
    },
    {
      id: 'c2',
      content: '2要素認証については、要件定義でオプション機能として検討されていましたが、必須ではありません。まずは基本認証の実装を優先しましょう。',
      createdBy: 'user1',
      createdByName: '鈴木 一郎',
      createdAt: '2023-07-28',
    },
  ],
  attachments: [
    {
      id: 'file1',
      name: '認証フロー図.pdf',
      size: '243 KB',
      type: 'application/pdf',
      url: '#',
      uploadedBy: 'user3',
      uploadedAt: '2023-07-25',
    },
  ],
};

export default function QuestionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [comment, setComment] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDelete = () => {
    // 実際には削除のAPIコールが必要
    setOpenDeleteDialog(false);
    router.push('/questions');
  };

  const handleCommentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComment(event.target.value);
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      // 実際にはコメント送信のAPIコールが必要
      console.log('Comment submitted:', comment);
      setComment('');
    }
  };

  const handleAcceptAnswer = (answerId: string) => {
    // 実際には回答承認のAPIコールが必要
    console.log('Answer accepted:', answerId);
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

  return (
    <DashboardLayout>
      <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {mockQuestion.title}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            <Chip 
              icon={<AccessTimeIcon />}
              label={`期限: ${new Date(mockQuestion.deadline).toLocaleDateString('ja-JP')}`}
              variant="outlined"
              color={new Date(mockQuestion.deadline) < new Date() ? 'error' : 'default'}
            />
            <Chip 
              label={mockQuestion.status} 
              color={getStatusColor(mockQuestion.status) as any}
            />
            <Chip 
              icon={<PersonIcon />}
              label={`作成者: ${mockQuestion.createdByName}`}
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              担当者:
            </Typography>
            <AvatarGroup max={3}>
              {mockQuestion.assignees.map((user) => (
                <Tooltip key={user.id} title={user.name}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.875rem' }}>
                    {user.name.charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {mockQuestion.tags.map(tag => (
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
            onClick={() => router.push(`/questions/${params.id}/answer`)}
          >
            回答する
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/questions/${params.id}/edit`)}
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
          <Tab label={`回答 (${mockQuestion.answers.length})`} {...a11yProps(1)} />
          <Tab label={`コメント (${mockQuestion.comments.length})`} {...a11yProps(2)} />
          <Tab label={`添付ファイル (${mockQuestion.attachments.length})`} {...a11yProps(3)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <div dangerouslySetInnerHTML={{ __html: mockQuestion.description.replace(/\n/g, '<br />') }} />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ReplyIcon />}
            onClick={() => router.push(`/questions/${params.id}/answer`)}
          >
            回答する
          </Button>
        </Box>
        
        {mockQuestion.answers.length > 0 ? (
          <Stack spacing={3}>
            {mockQuestion.answers.map((answer) => (
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
        
        {mockQuestion.comments.length > 0 ? (
          <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            {mockQuestion.comments.map((commentItem, index) => (
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
                {index < mockQuestion.comments.length - 1 && <Divider variant="inset" component="li" />}
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
        
        {mockQuestion.attachments.length > 0 ? (
          <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            {mockQuestion.attachments.map((file, index) => (
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
                {index < mockQuestion.attachments.length - 1 && <Divider variant="inset" component="li" />}
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
            「{mockQuestion.title}」を削除すると、すべての回答やコメントも削除されます。この操作は元に戻せません。
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