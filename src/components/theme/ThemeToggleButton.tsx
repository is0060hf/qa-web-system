'use client';

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // ダークモードアイコン
import Brightness7Icon from '@mui/icons-material/Brightness7'; // ライトモードアイコン
import { useThemeContext } from '../providers/ThemeProvider';

// ThemeToggleButtonコンポーネント
const ThemeToggleButton: React.FC = () => {
  const { mode, toggleColorMode } = useThemeContext();

  return (
    <Tooltip title={mode === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}>
      <IconButton
        onClick={toggleColorMode}
        color="inherit"
        aria-label={mode === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}
      >
        {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton; 