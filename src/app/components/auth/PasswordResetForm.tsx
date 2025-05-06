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

interface PasswordResetFormProps {
  onSubmit: (newPassword: string, token: string) => Promise<void>;
  token: string;
  isLoading?: boolean;
  error?: string;
  success?: boolean;
}

export default function PasswordResetForm({ 
  onSubmit, 
  token,
  isLoading = false, 
  error,
  success = false
}: PasswordResetFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const errors: { newPassword?: string; confirmPassword?: string } = {};
    
    if (!newPassword) {
      errors.newPassword = '新しいパスワードを入力してください';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'パスワードは8文字以上で入力してください';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'パスワード（確認）を入力してください';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      await onSubmit(newPassword, token);
    } catch (error) {
      // エラーはonSubmitで処理されるので、ここでは何もしない
    }
  };

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 8 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          新しいパスワードの設定
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success ? (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              パスワードが正常に更新されました。
            </Alert>
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link href="/login" passHref>
                <Button variant="contained" color="primary">
                  ログイン画面へ
                </Button>
              </Link>
            </Box>
          </>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <FormTextField
              name="newPassword"
              label="新しいパスワード"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={validationErrors.newPassword}
              required
              fullWidth
              disabled={isLoading}
              autoComplete="new-password"
              autoFocus
              data-testid="new-password-input"
              helperText={!validationErrors.newPassword ? "8文字以上で入力してください" : undefined}
            />
            
            <FormTextField
              name="confirmPassword"
              label="新しいパスワード（確認）"
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
                data-testid="submit-button"
                sx={{ py: 1.5 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'パスワードを更新'
                )}
              </Button>
            </Box>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link href="/login" passHref>
                <MuiLink variant="body2" underline="hover">
                  ログインページに戻る
                </MuiLink>
              </Link>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 