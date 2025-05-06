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
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import FormTextarea from '../common/FormTextarea';
import FormFileUpload from '../common/FormFileUpload';

// 回答フォームフィールドの種類
export enum AnswerFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  TEXTAREA = 'TEXTAREA',
  RADIO = 'RADIO',
  FILE = 'FILE'
}

// 回答フォームフィールドの定義
export interface AnswerFormField {
  id: string;
  label: string;
  fieldType: AnswerFieldType;
  isRequired: boolean;
  order: number;
  options?: string[]; // RADIOタイプの場合に使用
}

// 回答フォームのプロパティ
interface AnswerFormProps {
  onSubmit: (content: string, formData?: Record<string, any>, files?: File[]) => Promise<void>;
  initialContent?: string;
  initialFormData?: Record<string, any>;
  initialFiles?: File[];
  answerFormat: 'FREE_TEXT' | 'FORM';
  formFields?: AnswerFormField[];
  isLoading?: boolean;
  error?: string;
  isEditMode?: boolean;
  questionTitle?: string;
}

interface ValidationErrors {
  content?: string;
  formData?: Record<string, string | undefined>;
  files?: string;
}

export default function AnswerForm({ 
  onSubmit,
  initialContent = '',
  initialFormData = {},
  initialFiles = [],
  answerFormat = 'FREE_TEXT',
  formFields = [],
  isLoading = false, 
  error,
  isEditMode = false,
  questionTitle
}: AnswerFormProps) {
  // 自由記述用のコンテンツ
  const [content, setContent] = useState(initialContent);
  
  // フォーム形式のデータ
  const [formData, setFormData] = useState<Record<string, any>>(initialFormData);
  
  // 添付ファイル
  const [files, setFiles] = useState<File[]>(initialFiles);

  // バリデーションエラー
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    formData: {}
  });

  // 初期データが変更されたら状態を更新
  useEffect(() => {
    setContent(initialContent);
    setFormData(initialFormData);
    setFiles(initialFiles);
  }, [initialContent, initialFormData, initialFiles]);

  // フォームフィールド変更ハンドラ
  const handleFormDataChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // エラーをクリア
    if (validationErrors.formData && validationErrors.formData[fieldId]) {
      setValidationErrors(prev => ({
        ...prev,
        formData: {
          ...(prev.formData || {}),
          [fieldId]: undefined
        }
      }));
    }
  };

  // ファイル変更ハンドラ
  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);

    // エラーをクリア
    if (validationErrors.files) {
      setValidationErrors(prev => ({
        ...prev,
        files: undefined
      }));
    }
  };

  // バリデーション
  const validate = (): boolean => {
    const errors: ValidationErrors = {
      formData: {}
    };
    
    let isValid = true;
    
    if (answerFormat === 'FREE_TEXT') {
      if (!content.trim()) {
        errors.content = '回答内容を入力してください';
        isValid = false;
      }
    } else if (answerFormat === 'FORM') {
      // 各フォームフィールドのバリデーション
      for (const field of formFields) {
        if (field.isRequired) {
          if (field.fieldType === AnswerFieldType.FILE) {
            // ファイルのバリデーション
            const fileField = formData[field.id] as File[];
            if (!fileField || fileField.length === 0) {
              if (errors.formData) {
                errors.formData[field.id] = `${field.label}は必須です`;
              }
              isValid = false;
            }
          } else if (!formData[field.id]) {
            if (errors.formData) {
              errors.formData[field.id] = `${field.label}は必須です`;
            }
            isValid = false;
          }
        }
      }
    }
    
    setValidationErrors(errors);
    return isValid;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      await onSubmit(content, formData, files);
    } catch (error) {
      // エラーはonSubmitで処理されるので、ここでは何もしない
    }
  };

  // フォームフィールドの表示（順序でソート）
  const sortedFormFields = [...formFields].sort((a, b) => a.order - b.order);

  // フォームフィールドの描画
  const renderFormField = (field: AnswerFormField) => {
    const fieldError = validationErrors.formData && validationErrors.formData[field.id];
    
    switch (field.fieldType) {
      case AnswerFieldType.TEXT:
        return (
          <Box key={field.id} sx={{ mb: 3 }}>
            <FormControl fullWidth error={!!fieldError}>
              <FormLabel 
                htmlFor={field.id}
                required={field.isRequired}
                sx={{ mb: 1, fontWeight: 500 }}
              >
                {field.label}
              </FormLabel>
              <TextField
                id={field.id}
                name={field.id}
                value={formData[field.id] || ''}
                onChange={(e) => handleFormDataChange(field.id, e.target.value)}
                fullWidth
                error={!!fieldError}
                helperText={fieldError}
                disabled={isLoading}
                variant="outlined"
                size="medium"
              />
            </FormControl>
          </Box>
        );
        
      case AnswerFieldType.NUMBER:
        return (
          <Box key={field.id} sx={{ mb: 3 }}>
            <FormControl fullWidth error={!!fieldError}>
              <FormLabel 
                htmlFor={field.id}
                required={field.isRequired}
                sx={{ mb: 1, fontWeight: 500 }}
              >
                {field.label}
              </FormLabel>
              <TextField
                id={field.id}
                name={field.id}
                type="number"
                value={formData[field.id] || ''}
                onChange={(e) => handleFormDataChange(field.id, e.target.value)}
                fullWidth
                error={!!fieldError}
                helperText={fieldError}
                disabled={isLoading}
                variant="outlined"
                size="medium"
              />
            </FormControl>
          </Box>
        );
        
      case AnswerFieldType.TEXTAREA:
        return (
          <Box key={field.id} sx={{ mb: 3 }}>
            <FormControl fullWidth error={!!fieldError}>
              <FormLabel 
                htmlFor={field.id}
                required={field.isRequired}
                sx={{ mb: 1, fontWeight: 500 }}
              >
                {field.label}
              </FormLabel>
              <TextField
                id={field.id}
                name={field.id}
                value={formData[field.id] || ''}
                onChange={(e) => handleFormDataChange(field.id, e.target.value)}
                fullWidth
                multiline
                rows={4}
                error={!!fieldError}
                helperText={fieldError}
                disabled={isLoading}
                variant="outlined"
                size="medium"
              />
            </FormControl>
          </Box>
        );
        
      case AnswerFieldType.RADIO:
        return (
          <Box key={field.id} sx={{ mb: 3 }}>
            <FormControl fullWidth error={!!fieldError}>
              <FormLabel 
                htmlFor={field.id}
                required={field.isRequired}
                sx={{ mb: 1, fontWeight: 500 }}
              >
                {field.label}
              </FormLabel>
              <RadioGroup
                id={field.id}
                name={field.id}
                value={formData[field.id] || ''}
                onChange={(e) => handleFormDataChange(field.id, e.target.value)}
              >
                {field.options?.map((option) => (
                  <FormControlLabel 
                    key={option} 
                    value={option} 
                    control={<Radio disabled={isLoading} />} 
                    label={option} 
                    disabled={isLoading}
                  />
                ))}
              </RadioGroup>
              {fieldError && (
                <Typography color="error" variant="caption">
                  {fieldError}
                </Typography>
              )}
            </FormControl>
          </Box>
        );
        
      case AnswerFieldType.FILE:
        return (
          <Box key={field.id} sx={{ mb: 3 }}>
            <FormControl fullWidth error={!!fieldError}>
              <FormLabel 
                htmlFor={field.id}
                required={field.isRequired}
                sx={{ mb: 1, fontWeight: 500 }}
              >
                {field.label}
              </FormLabel>
              <Box>
                <FormFileUpload
                  name={field.id}
                  label={field.label}
                  value={formData[field.id] || []}
                  onChange={(files) => handleFormDataChange(field.id, files)}
                  error={fieldError}
                  required={field.isRequired}
                  disabled={isLoading}
                  showOptionalLabel={false}
                />
              </Box>
            </FormControl>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEditMode ? '回答を編集' : '回答の作成'}
        </Typography>
        
        {questionTitle && (
          <Typography variant="h6" color="text.secondary" gutterBottom>
            質問: {questionTitle}
          </Typography>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {answerFormat === 'FREE_TEXT' ? (
            <>
              <FormTextarea
                name="content"
                label="回答内容"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                error={validationErrors.content}
                required
                fullWidth
                disabled={isLoading}
                rows={8}
                placeholder="回答内容を入力してください"
                data-testid="answer-content-input"
              />
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                添付ファイル（任意）
              </Typography>
              
              <FormFileUpload
                name="files"
                label="添付ファイル"
                value={files}
                onChange={handleFilesChange}
                error={validationErrors.files}
                multiple
                accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                maxSize={1024 * 1024 * 1024} // 1GB
                disabled={isLoading}
                data-testid="answer-files-input"
              />
            </>
          ) : (
            <>
              {/* カスタムフォーム */}
              {sortedFormFields.map(field => renderFormField(field))}
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                追加コメント（任意）
              </Typography>
              
              <FormTextarea
                name="additionalContent"
                label="追加コメント"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                fullWidth
                disabled={isLoading}
                rows={4}
                placeholder="追加コメントがあれば入力してください"
              />
            </>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              disabled={isLoading}
              href="javascript:history.back()"
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
                isEditMode ? '更新する' : '回答を送信'
              )}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
} 