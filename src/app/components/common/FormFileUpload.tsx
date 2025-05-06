'use client';

import React, { useCallback, useState } from 'react';
import { 
  Box, 
  Button, 
  FormHelperText, 
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';

interface FormFileUploadProps {
  name: string;
  label: string;
  onChange: (files: File[]) => void;
  value: File[];
  error?: string;
  helperText?: string;
  required?: boolean;
  showOptionalLabel?: boolean;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
}

export default function FormFileUpload({
  name,
  label,
  value = [],
  onChange,
  error,
  helperText,
  required = false,
  showOptionalLabel = true,
  accept,
  multiple = false,
  maxSize,
  maxFiles = 5,
  disabled = false
}: FormFileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  
  const handleFileChange = useCallback((newFiles: FileList | null) => {
    if (!newFiles || disabled) return;
    
    // ファイル配列に変換
    const filesArray = Array.from(newFiles);
    
    // 複数選択が無効の場合は最初のファイルのみ使用
    const filesToUse = multiple ? filesArray : [filesArray[0]];
    
    // ファイル数の制限
    const limitedFiles = filesToUse.slice(0, maxFiles);
    
    // サイズの検証
    const validFiles = maxSize 
      ? limitedFiles.filter(file => file.size <= maxSize)
      : limitedFiles;
    
    // 既存のファイルと新しいファイルを結合（複数の場合）
    const updatedFiles = multiple 
      ? [...value, ...validFiles].slice(0, maxFiles) 
      : validFiles;
    
    onChange(updatedFiles);
  }, [value, onChange, multiple, maxSize, maxFiles, disabled]);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, [disabled]);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, [disabled]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
  }, [disabled]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileChange(files);
  }, [handleFileChange, disabled]);
  
  const removeFile = useCallback((index: number) => {
    if (disabled) return;
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  }, [value, onChange, disabled]);
  
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);
  
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
        <Typography 
          component="label" 
          htmlFor={name}
          variant="subtitle2" 
          sx={{ fontWeight: 500 }}
        >
          {label}
          {required && <Typography component="span" color="error.main"> *</Typography>}
        </Typography>
        {!required && showOptionalLabel && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            （任意）
          </Typography>
        )}
      </Box>
      
      <Box>
        <Paper
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            borderStyle: isDragActive ? 'dashed' : 'solid',
            borderColor: isDragActive ? 'primary.main' : error ? 'error.main' : 'divider',
            cursor: disabled ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: disabled ? 0.7 : 1
          }}
        >
          <input
            id={name}
            name={name}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFileChange(e.target.files)}
            style={{ display: 'none' }}
            disabled={disabled}
          />
          <label htmlFor={name}>
            <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body1" gutterBottom>
              {isDragActive 
                ? 'ファイルをドロップしてください' 
                : 'ファイルをドラッグ＆ドロップ、または'}
            </Typography>
            {!isDragActive && (
              <Button
                component="span"
                variant="contained"
                startIcon={<AttachFileIcon />}
                size="small"
                disabled={disabled}
              >
                ファイルを選択
              </Button>
            )}
            {maxSize && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                最大ファイルサイズ: {formatFileSize(maxSize)}
              </Typography>
            )}
            {multiple && (
              <Typography variant="caption" display="block">
                最大{maxFiles}ファイルまで
              </Typography>
            )}
            {accept && (
              <Typography variant="caption" display="block">
                対応形式: {accept.replace(/,/g, ', ')}
              </Typography>
            )}
          </label>
        </Paper>
      </Box>
      
      {value.length > 0 && (
        <List dense sx={{ mt: 1 }}>
          {value.map((file, index) => (
            <ListItem key={`${file.name}-${index}`} sx={{ py: 0.5 }}>
              <ListItemText
                primary={file.name}
                secondary={formatFileSize(file.size)}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  size="small" 
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
      
      {(error || helperText) && (
        <FormHelperText 
          error={!!error}
          sx={{ mx: 1.5, mt: 0.5 }}
        >
          {error || helperText}
        </FormHelperText>
      )}
    </Box>
  );
} 