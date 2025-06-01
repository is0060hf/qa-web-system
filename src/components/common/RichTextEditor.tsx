'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Box, Typography, FormHelperText } from '@mui/material';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// Markdownエディタをクライアントサイドでのみ読み込む
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { 
  ssr: false 
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
  height?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '内容を入力してください...',
  error = false,
  helperText,
  label,
  required = false,
  height = 300,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {label && (
        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
          <Typography 
            component="label" 
            variant="subtitle2" 
            sx={{ fontWeight: 500 }}
          >
            {label}
            {required && <Typography component="span" color="error.main"> *</Typography>}
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          '& .w-md-editor': {
            backgroundColor: 'background.paper',
            ...(error && {
              border: '1px solid',
              borderColor: 'error.main',
            }),
          },
          '& .w-md-editor-toolbar': {
            backgroundColor: 'background.default',
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
          },
          '& .w-md-editor.w-md-editor-focus': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
          },
          '& .w-md-editor-preview': {
            backgroundColor: 'background.paper',
          },
          '& .wmde-markdown': {
            backgroundColor: 'background.paper',
            color: 'text.primary',
          },
        }}
      >
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          preview="live"
          height={height}
          data-color-mode="light"
          textareaProps={{
            placeholder: placeholder,
          }}
        />
      </Box>
      {helperText && (
        <FormHelperText 
          error={error}
          sx={{ mx: 1.5, mt: 0.5 }}
        >
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default RichTextEditor; 