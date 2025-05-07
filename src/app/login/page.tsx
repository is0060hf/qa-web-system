'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  InputAdornment, 
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error: storeError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // ログイン画面表示時に認証ストアをリセット
  useEffect(() => {
    // 認証ストアのエラー状態を画面のエラー状態に反映
    if (storeError) {
      setError(storeError);
    }
    
    // ローカルストレージをクリア
    if (typeof window !== 'undefined') {
      // ログイン画面では認証状態をクリアしておく
      useAuthStore.setState({ 
        isLoading: false,
        error: null
      });
    }
  }, [storeError]);
  
  // URLクエリパラメータからリダイレクト理由を取得
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_expired') {
      setError('セッションの有効期限が切れました。再度ログインしてください。');
    } else if (reason === 'auth_required') {
      setError('この操作を行うにはログインが必要です。');
    } else if (reason === 'unauthorized') {
      setError('認証に失敗しました。再度ログインしてください。');
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    
    // 重複送信防止
    if (isLoading || hasSubmitted) return;
    
    setHasSubmitted(true);
    
    try {
      setError(null);
      await login(email, password);
      
      // リダイレクト先が指定されている場合はそこに戻る
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。もう一度お試しください。');
      setHasSubmitted(false);
    }
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
                ログイン
              </Typography>
              <Typography variant="body2" color="text.secondary">
                質問管理Webシステムにログイン
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
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
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="パスワード"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="パスワードの表示切替"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'ログイン'}
              </Button>
              
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Link href="/reset-password" style={{ textDecoration: 'none' }}>
                  <Typography color="primary" variant="body2">
                    パスワードをお忘れですか？
                  </Typography>
                </Link>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" display="inline">
                    アカウントをお持ちでない場合: 
                  </Typography>{' '}
                  <Link href="/register" style={{ textDecoration: 'none' }}>
                    <Typography color="primary" variant="body2" display="inline">
                      新規登録
                    </Typography>
                  </Link>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
} 