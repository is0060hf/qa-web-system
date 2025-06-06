'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { fetchData, useDataFetching } from '@/lib/utils/fetchData';
import MarkdownViewer from '@/components/common/MarkdownViewer';

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
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
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
}

interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

export default function AnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const questionId = resolvedParams.id;

  const [content, setContent] = useState('');
  const [formResponses, setFormResponses] = useState<{ [key: string]: string }>({});
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 質問データの取得
  const { 
    data: question, 
    isLoading, 
    error 
  } = useDataFetching<QuestionDetail | null>(
    () => fetchData<QuestionDetail>(`questions/${questionId}`),
    null
  );

  const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContent(event.target.value);
  };

  const handleFormFieldChange = (fieldId: string, value: string) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileRemove = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const validateForm = () => {
    if (!question) return false;

    // 自由記述形式の場合
    if (!question.answerForm) {
      return content.trim().length > 0;
    }

    // フォーム形式の場合
    for (const field of question.answerForm.fields) {
      if (field.isRequired && !formResponses[field.id]) {
        return false;
      }
    }

    return true;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Vercel Blob Client Upload を使用
      const { upload } = await import('@vercel/blob/client');
      
      // 認証トークンを取得
      const authStorage = localStorage.getItem('auth-storage');
      let token = '';
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          token = state?.token || '';
        } catch (e) {
          console.error('Failed to parse auth storage:', e);
        }
      }
      
      console.log('Starting client upload:', file.name);
      console.log('File size:', file.size);
      console.log('Has token:', !!token);
      
      // クライアントペイロードを準備
      const clientPayload = JSON.stringify({ 
        token,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/media/upload',
        clientPayload,
      });
      
      console.log('Upload successful:', blob);

      // メディアファイル情報を登録
      const mediaFile = await fetchData<{ id: string }>('media', {
        method: 'POST',
        body: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          storageUrl: blob.url,
        },
      });

      return mediaFile.id;
    } catch (error) {
      console.error('ファイルアップロードエラー:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSubmitError('必須項目を入力してください');
      return;
    }

    if (!question) {
      setSubmitError('質問情報の取得に失敗しました');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // ファイルをアップロード
      const mediaFileIds: string[] = [];
      if (attachedFiles.length > 0) {
        setSubmitError('ファイルをアップロード中...');
        
        for (const attachedFile of attachedFiles) {
          const fileId = await uploadFile(attachedFile.file);
          if (fileId) {
            mediaFileIds.push(fileId);
      } else {
            throw new Error(`ファイル ${attachedFile.name} のアップロードに失敗しました`);
          }
        }
        
        setSubmitError(null);
      }

      // 回答データを作成
      const answerData: any = {
        content: content || '',
        mediaFileIds,
      };

        // フォーム形式の場合
      if (question.answerForm) {
        const formDataArray = question.answerForm.fields.map(field => ({
          formFieldId: field.id,
          value: formResponses[field.id] || '',
        }));
        answerData.formData = formDataArray;
        }

      // プロジェクトIDを含む正しいAPIパスを使用
      await fetchData(`projects/${question.project.id}/questions/${questionId}/answers`, {
        method: 'POST',
        body: answerData,
      });

      // 成功したら質問詳細ページに戻る
      router.push(`/questions/${questionId}`);
    } catch (err: any) {
      console.error('回答投稿エラー:', err);
      setSubmitError(err.message || '回答の投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
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

  if (error || !question) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error || '質問が見つかりませんでした'}
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/questions')}>
          質問一覧に戻る
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/questions/${questionId}`)}
          sx={{ mb: 2 }}
        >
          質問詳細に戻る
        </Button>

        <Typography variant="h4" component="h1" gutterBottom>
          質問への回答
        </Typography>
      </Box>

      {/* 質問情報カード */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {question.title}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              icon={<PersonIcon />}
              label={`質問者: ${question.creator.name}`}
              size="small"
              variant="outlined"
            />
            {question.deadline && (
              <Chip
                icon={<AccessTimeIcon />}
                label={`期限: ${new Date(question.deadline).toLocaleDateString('ja-JP')}`}
                size="small"
                variant="outlined"
                color={new Date(question.deadline) < new Date() ? 'error' : 'default'}
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            <MarkdownViewer content={question.content} />
          </Box>
        </CardContent>
      </Card>

      {/* 回答フォーム */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          回答内容
        </Typography>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {question.answerForm ? (
          // カスタムフォーム形式
          <Box>
            <Stack spacing={3}>
              {question.answerForm.fields
                .sort((a, b) => a.order - b.order)
                .map(field => (
                  <Box key={field.id}>
                    {field.fieldType === 'TEXT' && (
                      <TextField
                        fullWidth
                        label={field.label}
                        required={field.isRequired}
                        value={formResponses[field.id] || ''}
                        onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                      />
                    )}

                    {field.fieldType === 'NUMBER' && (
                      <TextField
                        fullWidth
                        type="number"
                        label={field.label}
                        required={field.isRequired}
                        value={formResponses[field.id] || ''}
                        onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                      />
                    )}

                    {field.fieldType === 'TEXTAREA' && (
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label={field.label}
                        required={field.isRequired}
                        value={formResponses[field.id] || ''}
                        onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                      />
                    )}

                    {field.fieldType === 'RADIO' && (
                      <FormControl component="fieldset" required={field.isRequired}>
                        <FormLabel component="legend">{field.label}</FormLabel>
                        <RadioGroup
                          value={formResponses[field.id] || ''}
                          onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                        >
                          {field.options.map(option => (
                            <FormControlLabel
                              key={option}
                              value={option}
                              control={<Radio />}
                              label={option}
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    )}
                  </Box>
                ))}
            </Stack>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="追加コメント（任意）"
              value={content}
              onChange={handleContentChange}
              sx={{ mt: 3 }}
            />
          </Box>
        ) : (
          // 自由記述形式
          <TextField
            fullWidth
            multiline
            rows={8}
            label="回答内容"
            required
            value={content}
            onChange={handleContentChange}
            placeholder="回答を入力してください..."
          />
        )}

        {/* ファイル添付 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            ファイル添付（任意）
          </Typography>
          
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<AttachFileIcon />}
              sx={{ mb: 2 }}
            >
              ファイルを選択
            </Button>
          </label>

          {attachedFiles.length > 0 && (
            <List>
              {attachedFiles.map(file => (
                <ListItem key={file.id} disableGutters>
                  <ListItemText
                    primary={file.name}
                    secondary={formatFileSize(file.size)}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleFileRemove(file.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* 送信ボタン */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push(`/questions/${questionId}`)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={isSubmitting || !validateForm()}
          >
            {isSubmitting ? '送信中...' : '回答を送信'}
          </Button>
        </Box>
      </Paper>
    </DashboardLayout>
  );
} 