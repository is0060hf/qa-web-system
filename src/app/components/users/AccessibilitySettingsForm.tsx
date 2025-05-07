'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Switch,
  Alert,
  FormHelperText,
  Divider,
} from '@mui/material';
import { useAccessibility } from '../../../components/providers/AccessibilityProvider';
import { useThemeContext } from '../../../components/providers/ThemeProvider';

export default function AccessibilitySettingsForm() {
  const { highContrastMode, toggleHighContrastMode, fontSize, setFontSize } = useAccessibility();
  const { mode, toggleColorMode } = useThemeContext();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // フォントサイズ変更ハンドラ
  const handleFontSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(event.target.value as 'normal' | 'large' | 'larger');
    showSuccessMessage('フォントサイズを変更しました');
  };

  // ハイコントラストモード切替ハンドラ
  const handleContrastToggle = () => {
    toggleHighContrastMode();
    showSuccessMessage(highContrastMode ? 'ハイコントラストモードをオフにしました' : 'ハイコントラストモードをオンにしました');
  };

  // カラーモード切替ハンドラ
  const handleColorModeToggle = () => {
    toggleColorMode();
    showSuccessMessage(mode === 'light' ? 'ダークモードに変更しました' : 'ライトモードに変更しました');
  };

  // 成功メッセージを表示する関数
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    // 3秒後にメッセージを消す
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          アクセシビリティ設定
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend" id="font-size-group-label">
              フォントサイズ
            </FormLabel>
            <RadioGroup
              aria-labelledby="font-size-group-label"
              name="fontSize"
              value={fontSize}
              onChange={handleFontSizeChange}
            >
              <FormControlLabel value="normal" control={<Radio />} label="標準" />
              <FormControlLabel value="large" control={<Radio />} label="大きい (1.1倍)" />
              <FormControlLabel value="larger" control={<Radio />} label="最大 (1.2倍)" />
            </RadioGroup>
            <FormHelperText>
              画面の文字サイズを調整します
            </FormHelperText>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          <FormControl sx={{ mb: 3 }}>
            <FormLabel component="legend">
              ハイコントラストモード
            </FormLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={highContrastMode}
                    onChange={handleContrastToggle}
                    inputProps={{ 'aria-label': 'ハイコントラストモード切替' }}
                  />
                }
                label={highContrastMode ? 'オン' : 'オフ'}
              />
            </Box>
            <FormHelperText>
              コントラストを強くして、文字や要素をより見やすくします
            </FormHelperText>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          <FormControl sx={{ mb: 3 }}>
            <FormLabel component="legend">
              カラーモード
            </FormLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={mode === 'dark'}
                    onChange={handleColorModeToggle}
                    inputProps={{ 'aria-label': 'カラーモード切替' }}
                  />
                }
                label={mode === 'dark' ? 'ダークモード' : 'ライトモード'}
              />
            </Box>
            <FormHelperText>
              画面の色を明るいモードと暗いモードで切り替えます
            </FormHelperText>
          </FormControl>
        </Box>
      </CardContent>
    </Card>
  );
} 