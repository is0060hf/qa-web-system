'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography,
  Alert,
  CircularProgress 
} from '@mui/material';
import FormTextField from '../common/FormTextField';
import FormTextarea from '../common/FormTextarea';

interface ProjectFormProps {
  onSubmit: (name: string, description: string) => Promise<void>;
  initialData?: {
    name: string;
    description: string;
  };
  isLoading?: boolean;
  error?: string;
  isEditMode?: boolean;
}

export default function ProjectForm({ 
  onSubmit, 
  initialData,
  isLoading = false, 
  error,
  isEditMode = false
}: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  // 初期データが変更されたら状態を更新
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
    }
  }, [initialData]);

  const validate = (): boolean => {
    const errors: { name?: string; description?: string } = {};
    
    if (!name.trim()) {
      errors.name = 'プロジェクト名を入力してください';
    } else if (name.length > 100) {
      errors.name = 'プロジェクト名は100文字以内で入力してください';
    }
    
    if (description && description.length > 1000) {
      errors.description = '説明は1000文字以内で入力してください';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      await onSubmit(name, description);
    } catch (error) {
      // エラーはonSubmitで処理されるので、ここでは何もしない
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEditMode ? 'プロジェクト編集' : '新規プロジェクト作成'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <FormTextField
            name="name"
            label="プロジェクト名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={validationErrors.name}
            required
            fullWidth
            disabled={isLoading}
            autoFocus
            data-testid="project-name-input"
          />
          
          <FormTextarea
            name="description"
            label="説明"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={validationErrors.description}
            fullWidth
            disabled={isLoading}
            rows={4}
            placeholder="プロジェクトの説明を入力（任意）"
            data-testid="project-description-input"
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              disabled={isLoading}
              href="/dashboard"
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