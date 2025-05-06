'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Stack
} from '@mui/material';
import FormTextField from '../common/FormTextField';
import FormTextarea from '../common/FormTextarea';
import FormDatePicker from '../common/FormDatePicker';
import FormSelectField, { SelectOption } from '../common/FormSelectField';
import FormRadioGroup, { RadioOption } from '../common/FormRadioGroup';
import FormTagSelect, { TagOption } from '../common/FormTagSelect';

// 質問の優先度オプション
const PRIORITY_OPTIONS: RadioOption[] = [
  { value: 'HIGHEST', label: '最高' },
  { value: 'HIGH', label: '高' },
  { value: 'MEDIUM', label: '中' },
  { value: 'LOW', label: '低' }
];

// 回答形式オプション
const ANSWER_FORMAT_OPTIONS: RadioOption[] = [
  { value: 'FREE_TEXT', label: '自由記述' },
  { value: 'FORM', label: '回答フォームを使用' }
];

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
}

// 質問フォームのプロパティ
interface QuestionFormProps {
  onSubmit: (formData: QuestionFormData) => Promise<void>;
  initialData?: Partial<QuestionFormData>;
  projects?: Project[];
  projectMembers?: User[];
  projectTags?: Tag[];
  formTemplates?: FormTemplate[];
  isLoading?: boolean;
  error?: string;
  isEditMode?: boolean;
  currentProjectId?: string; // 編集モードやプロジェクト詳細画面からのアクセス時のプロジェクトID
}

// 質問フォームデータの型定義
export interface QuestionFormData {
  projectId: string;
  title: string;
  content: string;
  assigneeId: string;
  deadline: Date | null;
  priority: string;
  tagIds: string[];
  answerFormat: string;
  answerFormTemplateId?: string;
  answerFormFields?: any[]; // フォームビルダーで作成したフィールド
}

export default function QuestionForm({ 
  onSubmit,
  initialData,
  projects = [],
  projectMembers = [],
  projectTags = [],
  formTemplates = [],
  isLoading = false, 
  error,
  isEditMode = false,
  currentProjectId
}: QuestionFormProps) {
  // フォームのデフォルト値を設定
  const [formData, setFormData] = useState<QuestionFormData>({
    projectId: initialData?.projectId || currentProjectId || '',
    title: initialData?.title || '',
    content: initialData?.content || '',
    assigneeId: initialData?.assigneeId || '',
    deadline: initialData?.deadline || null,
    priority: initialData?.priority || 'MEDIUM',
    tagIds: initialData?.tagIds || [],
    answerFormat: initialData?.answerFormat || 'FREE_TEXT',
    answerFormTemplateId: initialData?.answerFormTemplateId || '',
    answerFormFields: initialData?.answerFormFields || []
  });

  // バリデーションエラー
  const [validationErrors, setValidationErrors] = useState<{
    projectId?: string;
    title?: string;
    content?: string;
    assigneeId?: string;
    deadline?: string;
    priority?: string;
    tagIds?: string;
    answerFormat?: string;
    answerFormTemplateId?: string;
    answerFormFields?: string;
  }>({});

  // 初期データが変更されたら状態を更新
  useEffect(() => {
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData
      }));
    }
  }, [initialData]);

  // プロジェクト選択肢の生成
  const projectOptions: SelectOption[] = projects.map(project => ({
    value: project.id,
    label: project.name
  }));

  // 担当者選択肢の生成
  const assigneeOptions: SelectOption[] = projectMembers.map(user => ({
    value: user.id,
    label: user.name || user.email
  }));

  // フォームテンプレート選択肢の生成
  const templateOptions: SelectOption[] = formTemplates.map(template => ({
    value: template.id,
    label: template.name
  }));

  // 入力フィールド変更時のハンドラ
  const handleChange = (field: keyof QuestionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // エラーをクリア
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // バリデーション
  const validate = (): boolean => {
    const errors: Partial<Record<keyof QuestionFormData, string>> = {};
    
    if (!formData.projectId) {
      errors.projectId = 'プロジェクトを選択してください';
    }
    
    if (!formData.title.trim()) {
      errors.title = 'タイトルを入力してください';
    } else if (formData.title.length > 200) {
      errors.title = 'タイトルは200文字以内で入力してください';
    }
    
    if (!formData.content.trim()) {
      errors.content = '質問内容を入力してください';
    }
    
    if (!formData.assigneeId) {
      errors.assigneeId = '担当者を選択してください';
    }
    
    if (formData.answerFormat === 'FORM' && !formData.answerFormTemplateId && (!formData.answerFormFields || formData.answerFormFields.length === 0)) {
      errors.answerFormTemplateId = '回答フォームテンプレートを選択するか、新しいフォームを作成してください';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      await onSubmit(formData);
    } catch (error) {
      // エラーはonSubmitで処理されるので、ここでは何もしない
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEditMode ? '質問を編集' : '新しい質問を作成'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* プロジェクト選択 (編集モード以外) */}
          {!isEditMode && !currentProjectId && (
            <FormSelectField
              name="projectId"
              label="プロジェクト"
              value={formData.projectId}
              onChange={(e) => handleChange('projectId', e.target.value)}
              options={projectOptions}
              error={validationErrors.projectId}
              required
              disabled={isLoading}
              data-testid="project-select"
            />
          )}
          
          {/* 質問タイトル */}
          <FormTextField
            name="title"
            label="質問タイトル"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={validationErrors.title}
            required
            fullWidth
            disabled={isLoading}
            autoFocus
            data-testid="question-title-input"
          />
          
          {/* 質問内容 */}
          <FormTextarea
            name="content"
            label="質問内容"
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            error={validationErrors.content}
            required
            fullWidth
            disabled={isLoading}
            rows={6}
            placeholder="質問の詳細を入力してください"
            data-testid="question-content-input"
          />
          
          {/* 担当者選択 */}
          <FormSelectField
            name="assigneeId"
            label="担当者"
            value={formData.assigneeId}
            onChange={(e) => handleChange('assigneeId', e.target.value)}
            options={assigneeOptions}
            error={validationErrors.assigneeId}
            required
            disabled={isLoading || projectMembers.length === 0}
            data-testid="assignee-select"
            helperText={projectMembers.length === 0 ? 'プロジェクトにメンバーがいません' : undefined}
          />
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* 回答期限 */}
            <Box sx={{ flex: 1 }}>
              <FormDatePicker
                name="deadline"
                label="回答期限"
                value={formData.deadline}
                onChange={(date) => handleChange('deadline', date)}
                error={validationErrors.deadline}
                disablePast
                disabled={isLoading}
                data-testid="deadline-picker"
              />
            </Box>
            
            {/* 優先度 */}
            <Box sx={{ flex: 1 }}>
              <FormRadioGroup
                name="priority"
                label="優先度"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                options={PRIORITY_OPTIONS}
                error={validationErrors.priority}
                required
                row
                disabled={isLoading}
                data-testid="priority-radio"
              />
            </Box>
          </Stack>
          
          {/* タグ選択 */}
          <FormTagSelect
            name="tags"
            label="タグ"
            value={formData.tagIds}
            onChange={(tagIds) => handleChange('tagIds', tagIds)}
            options={projectTags}
            error={validationErrors.tagIds}
            disabled={isLoading || projectTags.length === 0}
            placeholder="タグを選択（複数選択可）"
            helperText={projectTags.length === 0 ? 'プロジェクトにタグが設定されていません' : undefined}
            data-testid="tags-select"
          />
          
          <Divider sx={{ my: 3 }} />
          
          {/* 回答形式 */}
          <Typography variant="h6" gutterBottom>
            回答形式
          </Typography>
          
          <FormRadioGroup
            name="answerFormat"
            label="回答形式"
            value={formData.answerFormat}
            onChange={(e) => handleChange('answerFormat', e.target.value)}
            options={ANSWER_FORMAT_OPTIONS}
            error={validationErrors.answerFormat}
            required
            disabled={isLoading}
            data-testid="answer-format-radio"
          />
          
          {/* 回答フォーム選択 (answerFormat === 'FORM' の場合) */}
          {formData.answerFormat === 'FORM' && (
            <Box sx={{ mt: 2, mb: 3 }}>
              <FormSelectField
                name="answerFormTemplateId"
                label="回答フォームテンプレート"
                value={formData.answerFormTemplateId || ''}
                onChange={(e) => handleChange('answerFormTemplateId', e.target.value)}
                options={[
                  { value: '', label: 'テンプレートを選択' },
                  ...templateOptions
                ]}
                error={validationErrors.answerFormTemplateId}
                disabled={isLoading || formTemplates.length === 0}
                helperText={formTemplates.length === 0 ? '利用可能なテンプレートがありません' : '既存のテンプレートを選択するか、新規フォームを作成してください'}
                data-testid="form-template-select"
              />
              
              {/* TODO: フォームビルダーUIの実装 */}
              <Box sx={{ mt: 2 }}>
                <Typography color="text.secondary" variant="body2">
                  フォームビルダーUIは次のステップで実装します
                </Typography>
              </Box>
            </Box>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              disabled={isLoading}
              href={currentProjectId ? `/projects/${currentProjectId}` : "/dashboard"}
              data-testid="cancel-button"
            >
              キャンセル
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              data-testid="submit-button"
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isEditMode ? '更新する' : '作成する'
              )}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
} 