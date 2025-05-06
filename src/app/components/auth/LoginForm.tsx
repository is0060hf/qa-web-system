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

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export default function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    
    if (!email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!password) {
      errors.password = 'パスワードを入力してください';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      await onSubmit(email, password);
    } catch (error) {
      // エラーはonSubmitで処理されるので、ここでは何もしない
    }
  };

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 8 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          ログイン
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
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
            autoFocus
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
            autoComplete="current-password"
            data-testid="password-input"
          />
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={isLoading}
              data-testid="login-button"
              sx={{ py: 1.5 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'ログイン'
              )}
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Link href="/reset-password" passHref>
              <MuiLink variant="body2" underline="hover">
                パスワードをお忘れですか？
              </MuiLink>
            </Link>
            
            <Box sx={{ mt: {xs: 1, sm: 0} }}>
              <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                アカウントをお持ちでない場合:
              </Typography>
              <Link href="/register" passHref>
                <MuiLink variant="body2" underline="hover">
                  新規登録
                </MuiLink>
              </Link>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
} 