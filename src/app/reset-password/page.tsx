'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuthStore } from '../stores/authStore';

export default function RequestPasswordResetPage() {
  const { requestPasswordReset, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }
    
    try {
      setError(null);
      await requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワードリセット要求に失敗しました。もう一度お試しください。');
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          py: 4
        }}
      >
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3
              }}
            >
              <Typography component="h1" variant="h4" gutterBottom>
                パスワードをリセット
              </Typography>
              <Typography variant="body2" color="text.secondary">
                登録したメールアドレスを入力してください
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {isSubmitted ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  パスワードリセット用のリンクを送信しました。メールをご確認ください。
                </Alert>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Link href="/login" style={{ textDecoration: 'none' }}>
                    <Button variant="outlined">
                      ログイン画面に戻る
                    </Button>
                  </Link>
                </Box>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="メールアドレス"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'リセットリンクを送信'}
                </Button>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Link href="/login" style={{ textDecoration: 'none' }}>
                    <Typography color="primary" variant="body2">
                      ログイン画面に戻る
                    </Typography>
                  </Link>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
} 