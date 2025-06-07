'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Divider } from '@mui/material';
import UserSettingsForm, { UserSettingsData, PasswordChangeData } from '../components/users/UserSettingsForm';
import AccessibilitySettingsForm from '../components/users/AccessibilitySettingsForm';
import { fetchData } from '@/lib/utils/fetchData';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function SettingsPage() {
  // ユーザーデータの状態
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    profileImageUrl?: string;
  } | null>(null);
  
  // ローディングと通信状態
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ユーザーデータを取得
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchData<{name: string; email: string; profileImage?: {storageUrl: string}}>('auth/me', {});
        
        setUserData({
          name: data.name || '',
          email: data.email,
          profileImageUrl: data.profileImage?.storageUrl
        });
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // プロフィール情報更新処理
  const handleProfileUpdate = async (data: UserSettingsData) => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    
    try {
      const updatedUser = await fetchData<{name: string; email: string}>('users/me', {
        method: 'PATCH',
        body: data
      });
      
      // 成功したらユーザーデータを更新
      setUserData(prev => ({
        ...prev!,
        name: updatedUser.name
      }));
      
      setSuccessMessage('プロフィールを更新しました');
      
      // 3秒後に成功メッセージをクリア
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // パスワード変更処理
  const handlePasswordChange = async (data: PasswordChangeData) => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    
    try {
      await fetchData<{success: boolean}>('users/change-password', {
        method: 'POST',
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        }
      });
      
      setSuccessMessage('パスワードを変更しました');
      
      // 3秒後に成功メッセージをクリア
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to change password:', err);
      setError(err instanceof Error ? err.message : 'パスワードの変更に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // プロフィール画像アップロード処理
  const handleProfileImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetchData<{url: string}>('users/me/profile-image', {
      method: 'POST',
      body: formData
    });
    
    // 成功したらユーザーデータを更新
    setUserData(prev => prev ? {...prev, profileImageUrl: response.url} : null);
    
    return response.url;
  };

  // プロフィール画像削除処理
  const handleProfileImageRemove = async () => {
    await fetchData('users/me/profile-image', {
      method: 'DELETE'
    });
    
    // 成功したらユーザーデータを更新
    setUserData(prev => prev ? {...prev, profileImageUrl: undefined} : null);
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          アカウント設定
        </Typography>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress />
          </Box>
        ) : userData ? (
          <Box>
            <UserSettingsForm
              initialData={userData}
              onSubmit={handleProfileUpdate}
              onPasswordChange={handlePasswordChange}
              onProfileImageUpload={handleProfileImageUpload}
              onProfileImageRemove={handleProfileImageRemove}
              isLoading={isSubmitting}
              error={error || undefined}
              successMessage={successMessage || undefined}
            />
            
            <Box sx={{ my: 4 }}>
              <Divider />
            </Box>
            
            {/* アクセシビリティ設定フォーム */}
            <AccessibilitySettingsForm />
          </Box>
        ) : (
          <Typography color="error">
            ユーザー情報の読み込みに失敗しました。再読み込みしてください。
          </Typography>
        )}
      </Box>
    </DashboardLayout>
  );
} 