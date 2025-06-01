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
  Divider,
  Chip,
  Autocomplete,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
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
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { fetchData, postData } from '@/lib/utils/fetchData';

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

// プロジェクトメンバーの型定義
interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'MANAGER' | 'MEMBER';
  user: User;
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

// フォームの入力値の型定義
interface FormInput {
  projectId: string;
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

export default function CreateQuestionPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<string | null>(null);

  // React Hook Form の設定
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormInput>({
    defaultValues: {
      projectId: '',
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
  const selectedProjectId = watch('projectId');
  const saveAsTemplate = watch('saveAsTemplate');

  // プロジェクト変更時にタグとユーザーを再取得
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== currentProject) {
      setCurrentProject(selectedProjectId);
      
      // プロジェクトのタグを取得
      fetchData<Tag[]>(`projects/${selectedProjectId}/tags`)
        .then(data => setTags(data))
        .catch(err => setError('タグの取得に失敗しました: ' + err.message));
      
      // プロジェクトのメンバーを取得
      fetchData<ProjectMember[]>(`projects/${selectedProjectId}/members`)
        .then(data => {
          console.log('取得したメンバー:', data);
          setProjectMembers(data);
        })
        .catch(err => {
          console.error('メンバー取得エラー:', err);
          setError('メンバーの取得に失敗しました: ' + err.message);
        });
      
      // タグとメンバーが変わったのでリセット
      setValue('tagIds', []);
      setValue('assigneeId', '');
    }
  }, [selectedProjectId, currentProject, setValue]);

  // 初期データの取得
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // プロジェクト一覧を取得
        const projectsData = await fetchData<Project[]>('projects');
        setProjects(projectsData);
        
        // フォームテンプレート一覧を取得
        const templatesData = await fetchData<FormTemplate[]>('answer-form-templates');
        setTemplates(templatesData);
        
        // URLのクエリパラメータからプロジェクトIDを取得
        const urlParams = new URLSearchParams(window.location.search);
        const projectIdFromUrl = urlParams.get('projectId');
        if (projectIdFromUrl && projectsData.some(p => p.id === projectIdFromUrl)) {
          setValue('projectId', projectIdFromUrl);
        }
      } catch (err: any) {
        setError('データの取得に失敗しました: ' + err.message);
      }
    };
    
    fetchInitialData();
  }, [setValue]);

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
    setLoading(true);
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
      
      // 質問を作成
      await postData(`projects/${data.projectId}/questions`, requestData);
      
      // 作成成功後、質問一覧ページへリダイレクト
      router.push('/questions');
    } catch (err: any) {
      setError('質問の作成に失敗しました: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            新規質問作成
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
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              作成
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
              name="projectId"
              control={control}
              rules={{ required: 'プロジェクトを選択してください' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.projectId}>
                  <InputLabel>プロジェクト *</InputLabel>
                  <Select
                    {...field}
                    label="プロジェクト *"
                  >
                    {projects.map(project => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.projectId && (
                    <FormHelperText>{errors.projectId.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

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
                <TextField
                  {...field}
                  label="質問内容 *"
                  fullWidth
                  multiline
                  rows={6}
                  error={!!errors.content}
                  helperText={errors.content?.message}
                />
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
                    disabled={!selectedProjectId}
                  >
                    {projectMembers.map(member => (
                      <MenuItem key={member.userId} value={member.user.id}>
                        {member.user.name || member.user.email}
                      </MenuItem>
                    ))}
                  </Select>
                  {!selectedProjectId && (
                    <FormHelperText>
                      プロジェクトを先に選択してください
                    </FormHelperText>
                  )}
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
                  disabled={!selectedProjectId}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="タグ"
                      helperText={!selectedProjectId ? 'プロジェクトを先に選択してください' : ''}
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
                />
                <FormControlLabel
                  value="form"
                  control={<Radio />}
                  label="回答フォームを使用"
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
                  <FormControl fullWidth sx={{ mb: 3 }}>
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
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Box sx={{ flex: { xs: '1', sm: '5' } }}>
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
                              />
                            )}
                          />
                        </Box>
                        <Box sx={{ flex: { xs: '1', sm: '4' } }}>
                          <Controller
                            name={`formFields.${index}.fieldType`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth size="small">
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
                        <Box sx={{ flex: { xs: '1', sm: '2' }, display: 'flex', alignItems: 'center' }}>
                          <Controller
                            name={`formFields.${index}.isRequired`}
                            control={control}
                            render={({ field }) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                  />
                                }
                                label="必須"
                              />
                            )}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveField(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      {watch(`formFields.${index}.fieldType`) === 'RADIO' && (
                        <Box>
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
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              <FormControlLabel
                control={
                  <Controller
                    name="saveAsTemplate"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
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