'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { fetchData } from '@/lib/utils/fetchData';

export default function CreateProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基本的なバリデーション
    if (!name.trim()) {
      setError('プロジェクト名は必須です');
      return;
    }
    
    if (name.length > 100) {
      setError('プロジェクト名は100文字以内で入力してください');
      return;
    }
    
    if (description && description.length > 1000) {
      setError('説明は1000文字以内で入力してください');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const projectData = { name, description };
      const response = await fetchData('projects', {
        method: 'POST',
        body: projectData,
      });
      
      // プロジェクト一覧ページにリダイレクト
      router.push('/projects');
      
    } catch (err: any) {
      setError(err.message || 'プロジェクトの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    router.push('/projects');
  };
  
  return (
    <DashboardLayout>
      <Container maxWidth="md">
        <Typography variant="h4" component="h1" gutterBottom>
          新規プロジェクト作成
        </Typography>
        
        <Paper elevation={2} sx={{ p: 4, mt: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="プロジェクト名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                error={!!error && error.includes('プロジェクト名')}
                helperText="100文字以内で入力してください"
                disabled={isLoading}
              />
              
              <TextField
                label="説明"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={4}
                error={!!error && error.includes('説明')}
                helperText="1000文字以内で入力してください（任意）"
                disabled={isLoading}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  キャンセル
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      作成中...
                    </>
                  ) : (
                    '作成'
                  )}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Container>
    </DashboardLayout>
  );
} 