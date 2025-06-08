'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stack,
  Paper,
  Chip,
  Autocomplete,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ja } from 'date-fns/locale/ja';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import RichTextEditor from '@/components/common/RichTextEditor';
import { fetchData, updateData } from '@/lib/utils/fetchData';

// フォームフィールド型の定義
type FormFieldType = 'TEXT' | 'NUMBER' | 'RADIO' | 'FILE' | 'TEXTAREA';

// フォームフィールドの型定義
interface FormField {
  id: string;
  label: string;
  fieldType: FormFieldType;
  options?: string[]; // RADIOタイプ用
  isRequired: boolean;
  order: number;
}

// プロジェクトの型定義
interface Project {
  id: string;
  name: string;
}

// ユーザーの型定義
interface User {
  id: string;
  name: string;
  email: string;
}

// タグの型定義
interface Tag {
  id: string;
  name: string;
}

// フォームテンプレートの型定義
interface FormTemplate {
  id: string;
  name: string;
  description?: string;
}

// 質問の型定義
interface Question {
  id: string;
  title: string;
  content: string;
  projectId: string;
  assigneeId: string;
  deadline: string | null;
  priority: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';
  tags: Tag[];
  answerForm?: {
    id: string;
    fields: FormField[];
  } | null;
  answers?: Array<{ id: string }>; // 回答の有無を確認
}

// フォームの入力値の型定義
interface FormInput {
  title: string;
  content: string;
  assigneeId: string;
  deadline: Date | null;
  priority: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';
  tagIds: string[];
  answerFormType: 'free' | 'form';
  templateId?: string;
  formFields: FormField[];
  saveAsTemplate: boolean;
  templateName?: string;
}

function EditQuestionPageClient({ id }: { id: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnswers, setHasAnswers] = useState(false);

  // React Hook Form の設定
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormInput>({
    defaultValues: {
      title: '',
      content: '',
      assigneeId: '',
      deadline: null,
      priority: 'MEDIUM',
      tagIds: [],
      answerFormType: 'free',
      formFields: [],
      saveAsTemplate: false,
      templateName: '',
    }
  });

  const answerFormType = watch('answerFormType');
  const saveAsTemplate = watch('saveAsTemplate');

  // 質問データの取得
  useEffect(() => {
    const fetchQuestionData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 質問データを取得
        const questionData = await fetchData<Question>(`questions/${id}`);
        setQuestion(questionData);
        
        // 回答の有無をチェック
        const answersExist = questionData.answers && questionData.answers.length > 0;
        setHasAnswers(!!answersExist);
        
        // フォームにデータをセット
        setValue('title', questionData.title);
        setValue('content', questionData.content);
        setValue('assigneeId', questionData.assigneeId);
        setValue('deadline', questionData.deadline ? new Date(questionData.deadline) : null);
        setValue('priority', questionData.priority);
        setValue('tagIds', questionData.tags.map(tag => tag.id));
        
        // 回答フォームの設定
        if (questionData.answerForm) {
          setValue('answerFormType', 'form');
          setValue('formFields', questionData.answerForm.fields);
        } else {
          setValue('answerFormType', 'free');
        }
        
        // プロジェクトのタグを取得
        const tagsData = await fetchData<Tag[]>(`projects/${questionData.projectId}/tags`);
        setTags(tagsData);
        
        // プロジェクトのメンバーを取得
        const usersData = await fetchData<User[]>(`projects/${questionData.projectId}/members`);
        setUsers(usersData);
        
        // フォームテンプレート一覧を取得
        const templatesData = await fetchData<FormTemplate[]>('answer-form-templates');
        setTemplates(templatesData);
        
        setLoading(false);
      } catch (err: any) {
        setError('質問データの取得に失敗しました: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchQuestionData();
  }, [id, setValue]);

  // テンプレート選択時の処理
  const handleTemplateChange = async (templateId: string) => {
    if (!templateId) return;
    
    try {
      const template = await fetchData<{
        id: string;
        name: string;
        description?: string;
        fields: FormField[];
      }>(`answer-form-templates/${templateId}`);
      
      setValue('formFields', template.fields);
    } catch (err: any) {
      setError('テンプレートの取得に失敗しました: ' + err.message);
    }
  };

  // フォームフィールドの追加
  const handleAddField = () => {
    const formFields = watch('formFields') || [];
    setValue('formFields', [
      ...formFields,
      {
        id: `field-${Date.now()}`,
        label: '',
        fieldType: 'TEXT',
        isRequired: false,
        order: formFields.length + 1,
      }
    ]);
  };

  // フォームフィールドの削除
  const handleRemoveField = (index: number) => {
    const formFields = watch('formFields');
    setValue(
      'formFields',
      formFields.filter((_, i) => i !== index).map((field, i) => ({
        ...field,
        order: i + 1
      }))
    );
  };

  // フォーム送信処理
  const onSubmit = async (data: FormInput) => {
    if (!question) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // APIリクエスト用のデータを整形
      const requestData = {
        ...data,
        deadline: data.deadline ? data.deadline.toISOString() : null,
        // テンプレート関連の情報を整形
        answerForm: data.answerFormType === 'form' ? {
          fields: data.formFields,
        } : null,
        answerFormTemplateId: data.answerFormType === 'form' && data.templateId ? data.templateId : null,
        saveAsTemplate: data.saveAsTemplate,
        templateName: data.saveAsTemplate ? data.templateName : null,
      };
      
      // 質問を更新
      await updateData(`questions/${id}`, requestData);
      
      // 更新成功後、質問詳細ページへリダイレクト
      router.push(`/questions/${id}`);
    } catch (err: any) {
      setError('質問の更新に失敗しました: ' + err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!question) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ my: 4 }}>
          質問が見つかりませんでした。
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            質問編集
          </Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              sx={{ mr: 2 }}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              更新
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 4 }}>
          <Stack spacing={3}>
            <Controller
              name="title"
              control={control}
              rules={{ required: '質問タイトルを入力してください' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="質問タイトル *"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />

            <Controller
              name="content"
              control={control}
              rules={{ required: '質問内容を入力してください' }}
              render={({ field }) => (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    質問内容 *
                  </Typography>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
                  {errors.content && (
                    <FormHelperText error>
                      {errors.content.message}
                    </FormHelperText>
                  )}
                </Box>
              )}
            />

            <Controller
              name="assigneeId"
              control={control}
              rules={{ required: '担当者を選択してください' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.assigneeId}>
                  <InputLabel>担当者 *</InputLabel>
                  <Select
                    {...field}
                    label="担当者 *"
                  >
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.assigneeId && (
                    <FormHelperText>{errors.assigneeId.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="deadline"
              control={control}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
                  <DatePicker
                    label="回答期限"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.deadline,
                        helperText: errors.deadline?.message,
                      },
                    }}
                  />
                </LocalizationProvider>
              )}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>優先度</InputLabel>
                  <Select {...field} label="優先度">
                    <MenuItem value="HIGHEST">最高</MenuItem>
                    <MenuItem value="HIGH">高</MenuItem>
                    <MenuItem value="MEDIUM">中</MenuItem>
                    <MenuItem value="LOW">低</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="tagIds"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={tags}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={
                    field.value
                      ? tags.filter(tag => field.value.includes(tag.id))
                      : []
                  }
                  onChange={(_, newValue) => {
                    field.onChange(newValue.map(tag => tag.id));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="タグ"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.name}
                        {...getTagProps({ index })}
                        key={option.id}
                      />
                    ))
                  }
                />
              )}
            />
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            回答形式
          </Typography>
          
          {hasAnswers && (
            <Alert severity="info" sx={{ mb: 2 }}>
              この質問には既に回答がついているため、回答フォームの変更はできません。
            </Alert>
          )}
          
          <Controller
            name="answerFormType"
            control={control}
            render={({ field }) => (
              <RadioGroup
                {...field}
                row
              >
                <FormControlLabel
                  value="free"
                  control={<Radio />}
                  label="自由記述"
                  disabled={hasAnswers}
                />
                <FormControlLabel
                  value="form"
                  control={<Radio />}
                  label="回答フォームを使用"
                  disabled={hasAnswers}
                />
              </RadioGroup>
            )}
          />

          {answerFormType === 'form' && (
            <Box sx={{ mt: 3 }}>
              <Controller
                name="templateId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth sx={{ mb: 3 }} disabled={hasAnswers}>
                    <InputLabel>テンプレートから選択</InputLabel>
                    <Select
                      {...field}
                      label="テンプレートから選択"
                      displayEmpty
                      onChange={(e) => {
                        field.onChange(e);
                        handleTemplateChange(e.target.value);
                      }}
                    >
                      <MenuItem value="">
                        <em>テンプレートを使用しない</em>
                      </MenuItem>
                      {templates.map(template => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1">
                  フォームフィールド
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddField}
                  variant="outlined"
                  size="small"
                  disabled={hasAnswers}
                >
                  フィールド追加
                </Button>
              </Box>

              <Stack spacing={2} sx={{ mb: 3 }}>
                {watch('formFields')?.map((field, index) => (
                  <Paper
                    key={field.id}
                    variant="outlined"
                    sx={{ p: 2 }}
                  >
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                      <Box sx={{ flex: '1 1 250px' }}>
                        <Controller
                          name={`formFields.${index}.label`}
                          control={control}
                          rules={{ required: 'ラベルを入力してください' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="フィールドラベル"
                              fullWidth
                              size="small"
                              error={!!errors.formFields?.[index]?.label}
                              helperText={errors.formFields?.[index]?.label?.message}
                              disabled={hasAnswers}
                            />
                          )}
                        />
                      </Box>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Controller
                          name={`formFields.${index}.fieldType`}
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth size="small" disabled={hasAnswers}>
                              <InputLabel>タイプ</InputLabel>
                              <Select {...field} label="タイプ">
                                <MenuItem value="TEXT">テキスト</MenuItem>
                                <MenuItem value="NUMBER">数値</MenuItem>
                                <MenuItem value="RADIO">ラジオボタン</MenuItem>
                                <MenuItem value="FILE">ファイル</MenuItem>
                                <MenuItem value="TEXTAREA">複数行テキスト</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Box>
                      <Box sx={{ flex: '0 0 auto' }}>
                        <Controller
                          name={`formFields.${index}.isRequired`}
                          control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Radio
                                  checked={field.value}
                                  onChange={(e) => field.onChange(e.target.checked)}
                                  disabled={hasAnswers}
                                />
                              }
                              label="必須"
                            />
                          )}
                        />
                      </Box>
                      <Box sx={{ flex: '0 0 auto' }}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveField(index)}
                          disabled={hasAnswers}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      {watch(`formFields.${index}.fieldType`) === 'RADIO' && (
                        <Box sx={{ flex: '1 1 100%' }}>
                          <Controller
                            name={`formFields.${index}.options`}
                            control={control}
                            defaultValue={[]}
                            rules={{ 
                              validate: value => 
                                watch(`formFields.${index}.fieldType`) !== 'RADIO' || 
                                (value && value.length > 0) || 
                                'オプションを1つ以上追加してください' 
                            }}
                            render={({ field }) => (
                              <Autocomplete
                                multiple
                                freeSolo
                                options={[]}
                                value={field.value || []}
                                onChange={(_, newValue) => {
                                  field.onChange(newValue);
                                }}
                                disabled={hasAnswers}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="オプション（カンマ区切りで入力）"
                                    size="small"
                                    helperText={errors.formFields?.[index]?.options?.message || '「追加」ボタンを押してオプションを追加できます'}
                                    error={!!errors.formFields?.[index]?.options}
                                  />
                                )}
                                renderTags={(value, getTagProps) =>
                                  value.map((option, i) => (
                                    <Chip
                                      size="small"
                                      label={option}
                                      {...getTagProps({ index: i })}
                                      key={i}
                                    />
                                  ))
                                }
                              />
                            )}
                          />
                        </Box>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Stack>

              <FormControlLabel
                control={
                  <Controller
                    name="saveAsTemplate"
                    control={control}
                    render={({ field }) => (
                      <Radio
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={hasAnswers}
                      />
                    )}
                  />
                }
                label="このフォームをテンプレートとして保存"
              />

              {saveAsTemplate && (
                <Controller
                  name="templateName"
                  control={control}
                  rules={{ required: 'テンプレート名を入力してください' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="テンプレート名"
                      fullWidth
                      size="small"
                      sx={{ mt: 2 }}
                      error={!!errors.templateName}
                      helperText={errors.templateName?.message}
                    />
                  )}
                />
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </DashboardLayout>
  );
}

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditQuestionPageClient id={id} />;
} 