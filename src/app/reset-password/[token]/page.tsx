'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAuthStore } from '../../stores/authStore';

interface ResetPasswordPageProps {
  params: {
    token: string;
  };
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = params;
  const router = useRouter();
  const { resetPassword, isLoading } = useAuthStore();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const validateForm = () => {
    const errors = {
      newPassword: '',
      confirmPassword: ''
    };
    
    let isValid = true;
    
    // パスワードの検証
    if (!newPassword) {
      errors.newPassword = '新しいパスワードを入力してください';
      isValid = false;
    } else if (newPassword.length < 8) {
      errors.newPassword = 'パスワードは8文字以上で入力してください';
      isValid = false;
    }
    
    // パスワード確認の検証
    if (!confirmPassword) {
      errors.confirmPassword = '確認用パスワードを入力してください';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
      isValid = false;
    }
    
    setValidationErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setError(null);
      await resetPassword(token, newPassword);
      setIsCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワードリセットに失敗しました。もう一度お試しください。');
    }
  };
  
  const handleToggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };
  
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
                新しいパスワードを設定
              </Typography>
              <Typography variant="body2" color="text.secondary">
                安全な新しいパスワードを入力してください
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {isCompleted ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  パスワードが正常に更新されました。新しいパスワードでログインしてください。
                </Alert>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    onClick={() => router.push('/login')}
                  >
                    ログイン画面へ
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="newPassword"
                  label="新しいパスワード"
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  autoComplete="new-password"
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  error={!!validationErrors.newPassword}
                  helperText={validationErrors.newPassword || 'パスワードは8文字以上で入力してください'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="パスワードの表示切替"
                          onClick={handleToggleNewPasswordVisibility}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="新しいパスワード（確認）"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  error={!!validationErrors.confirmPassword}
                  helperText={validationErrors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="確認用パスワードの表示切替"
                          onClick={handleToggleConfirmPasswordVisibility}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                  {isLoading ? <CircularProgress size={24} /> : 'パスワードを更新'}
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