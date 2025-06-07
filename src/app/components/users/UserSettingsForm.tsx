'use client';

import React, { useState } from 'react';
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
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import FormTextField from '../common/FormTextField';

// ユーザー設定フォームのプロパティ
interface UserSettingsFormProps {
  onSubmit: (data: UserSettingsData) => Promise<void>;
  onPasswordChange: (data: PasswordChangeData) => Promise<void>;
  onProfileImageUpload?: (file: File) => Promise<string>; // Returns the image URL
  onProfileImageRemove?: () => Promise<void>;
  initialData: {
    name: string;
    email: string;
    profileImageUrl?: string;
  };
  isLoading?: boolean;
  error?: string;
  successMessage?: string;
}

// ユーザー設定データの型定義
export interface UserSettingsData {
  name: string;
}

// パスワード変更データの型定義
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserSettingsForm({ 
  onSubmit,
  onPasswordChange,
  onProfileImageUpload,
  onProfileImageRemove,
  initialData,
  isLoading = false, 
  error,
  successMessage
}: UserSettingsFormProps) {
  // プロフィール情報の状態
  const [profileData, setProfileData] = useState<UserSettingsData>({
    name: initialData.name || ''
  });

  // プロフィール画像の状態
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(initialData.profileImageUrl);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // パスワード変更の状態
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // バリデーションエラー
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // プロフィール情報変更ハンドラ
  const handleProfileChange = (field: keyof UserSettingsData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));

    // エラーをクリア
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // パスワード情報変更ハンドラ
  const handlePasswordChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));

    // エラーをクリア
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // プロフィール情報のバリデーション
  const validateProfile = (): boolean => {
    const errors: { name?: string } = {};
    
    if (!profileData.name.trim()) {
      errors.name = '氏名を入力してください';
    }
    
    setValidationErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // パスワード変更のバリデーション
  const validatePassword = (): boolean => {
    const errors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = '現在のパスワードを入力してください';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = '新しいパスワードを入力してください';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'パスワードは8文字以上で入力してください';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = '確認用パスワードを入力してください';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }
    
    setValidationErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // 画像アップロードハンドラー
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onProfileImageUpload) return;

    // 画像ファイルのみ許可
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    // ファイルサイズ制限（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    setIsUploadingImage(true);
    try {
      const newImageUrl = await onProfileImageUpload(file);
      setProfileImageUrl(newImageUrl);
    } catch (error) {
      alert('画像のアップロードに失敗しました');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 画像削除ハンドラー
  const handleImageRemove = async () => {
    if (!onProfileImageRemove) return;

    setIsUploadingImage(true);
    try {
      await onProfileImageRemove();
      setProfileImageUrl(undefined);
    } catch (error) {
      alert('画像の削除に失敗しました');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // プロフィール更新のハンドラ
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfile()) return;
    
    try {
      await onSubmit(profileData);
    } catch (error) {
      // エラーはonSubmitで処理されるので、ここでは何もしない
    }
  };

  // パスワード変更のハンドラ
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    try {
      await onPasswordChange(passwordData);
      // 成功したらフォームをリセット
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      // エラーはonPasswordChangeで処理されるので、ここでは何もしない
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          プロフィール設定
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleProfileSubmit} noValidate sx={{ mb: 4 }}>
          {/* プロフィール画像 */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={profileImageUrl}
              sx={{ width: 100, height: 100, bgcolor: 'primary.main' }}
            >
              {!profileImageUrl && (initialData.name || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="profile-image-upload"
                type="file"
                onChange={handleImageUpload}
                disabled={isLoading || isUploadingImage}
              />
              <label htmlFor="profile-image-upload">
                <Tooltip title="プロフィール画像を変更">
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                    disabled={isLoading || isUploadingImage}
                  >
                    {isUploadingImage ? <CircularProgress size={24} /> : <PhotoCamera />}
                  </IconButton>
                </Tooltip>
              </label>
              {profileImageUrl && onProfileImageRemove && (
                <Tooltip title="プロフィール画像を削除">
                  <IconButton
                    color="error"
                    aria-label="delete picture"
                    onClick={handleImageRemove}
                    disabled={isLoading || isUploadingImage}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              )}
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                推奨: 正方形の画像、最大5MB
              </Typography>
            </Box>
          </Box>

          <FormTextField
            name="name"
            label="氏名"
            value={profileData.name}
            onChange={(e) => handleProfileChange('name', e.target.value)}
            error={validationErrors.name}
            required
            fullWidth
            disabled={isLoading}
            autoFocus
            data-testid="name-input"
          />
          
          <TextField
            name="email"
            label="メールアドレス"
            value={initialData.email}
            fullWidth
            disabled={true}
            sx={{ mb: 3 }}
            InputProps={{
              readOnly: true,
            }}
            helperText="メールアドレスは変更できません"
            data-testid="email-input"
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              data-testid="profile-submit-button"
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : '更新する'}
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" component="h2" gutterBottom>
          パスワード変更
        </Typography>
        
        <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
          <FormTextField
            name="currentPassword"
            label="現在のパスワード"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
            error={validationErrors.currentPassword}
            required
            fullWidth
            disabled={isLoading}
            data-testid="current-password-input"
          />
          
          <FormTextField
            name="newPassword"
            label="新しいパスワード"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            error={validationErrors.newPassword}
            required
            fullWidth
            disabled={isLoading}
            helperText="8文字以上で入力してください"
            data-testid="new-password-input"
          />
          
          <FormTextField
            name="confirmPassword"
            label="新しいパスワード（確認）"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            error={validationErrors.confirmPassword}
            required
            fullWidth
            disabled={isLoading}
            data-testid="confirm-password-input"
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              data-testid="password-submit-button"
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : 'パスワードを変更'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
} 