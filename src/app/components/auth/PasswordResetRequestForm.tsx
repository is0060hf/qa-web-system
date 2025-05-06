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

interface PasswordResetRequestFormProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  success?: boolean;
}

export default function PasswordResetRequestForm({ 
  onSubmit, 
  isLoading = false, 
  error,
  success = false
}: PasswordResetRequestFormProps) {
  const [email, setEmail] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
  }>({});

  const validate = (): boolean => {
    const errors: { email?: string } = {};
    
    if (!email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      await onSubmit(email);
    } catch (error) {
      // エラーはonSubmitで処理されるので、ここでは何もしない
    }
  };

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 8 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          パスワードのリセット
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          登録したメールアドレスを入力してください。パスワードリセットのリンクを送信します。
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            パスワードリセットのリンクを送信しました。メールをご確認ください。
          </Alert>
        )}
        
        {!success && (
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
            
            <Box sx={{ mt: 3, mb: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={isLoading}
                data-testid="submit-button"
                sx={{ py: 1.5 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'リセットリンクを送信'
                )}
              </Button>
            </Box>
          </Box>
        )}
        
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link href="/login" passHref>
            <MuiLink variant="body2" underline="hover">
              ログインページに戻る
            </MuiLink>
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
} 