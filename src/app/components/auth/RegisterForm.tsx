'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Link as MuiLink, 
  Typography,
  Alert,
  CircularProgress 
} from '@mui/material';
import FormTextField from '../common/FormTextField';
import Link from 'next/link';

interface RegisterFormProps {
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export default function RegisterForm({ onSubmit, isLoading = false, error }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const errors: { 
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    
    // 名前は任意のためバリデーションなし
    
    if (!email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!password) {
      errors.password = 'パスワードを入力してください';
    } else if (password.length < 8) {
      errors.password = 'パスワードは8文字以上で入力してください';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'パスワード（確認）を入力してください';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      await onSubmit(name, email, password);
    } catch (error) {
      // エラーはonSubmitで処理されるので、ここでは何もしない
    }
  };

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 8 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          新規登録
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <FormTextField
            name="name"
            label="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={validationErrors.name}
            fullWidth
            disabled={isLoading}
            autoComplete="name"
            autoFocus
            data-testid="name-input"
          />
          
          <FormTextField
            name="email"
            label="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={validationErrors.email}
            required
            fullWidth
            disabled={isLoading}
            autoComplete="email"
            data-testid="email-input"
          />
          
          <FormTextField
            name="password"
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={validationErrors.password}
            required
            fullWidth
            disabled={isLoading}
            autoComplete="new-password"
            data-testid="password-input"
            helperText={!validationErrors.password ? "8文字以上で入力してください" : undefined}
          />
          
          <FormTextField
            name="confirmPassword"
            label="パスワード（確認）"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={validationErrors.confirmPassword}
            required
            fullWidth
            disabled={isLoading}
            autoComplete="new-password"
            data-testid="confirm-password-input"
          />
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={isLoading}
              data-testid="register-button"
              sx={{ py: 1.5 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                '登録する'
              )}
            </Button>
          </Box>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" component="span" sx={{ mr: 1 }}>
              アカウントをお持ちの場合:
            </Typography>
            <Link href="/login" passHref>
              <MuiLink variant="body2" underline="hover">
                ログイン
              </MuiLink>
            </Link>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
} 