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
  Paper,
  LinearProgress,
  Avatar,
  ListItemAvatar
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import TextFieldsIcon from '@mui/icons-material/TextFields';

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
  onUploadProgress?: (progress: number) => void; // アップロード進捗コールバック
}

// ファイルアイコンを取得
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <ImageIcon />;
  if (fileType === 'application/pdf') return <PictureAsPdfIcon />;
  if (fileType.startsWith('video/')) return <VideoFileIcon />;
  if (fileType.startsWith('audio/')) return <AudioFileIcon />;
  if (fileType.startsWith('text/')) return <TextFieldsIcon />;
  return <InsertDriveFileIcon />;
};

// 画像ファイルのプレビューURLを生成
const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface FileWithPreview extends File {
  preview?: string;
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
  disabled = false,
  onUploadProgress
}: FormFileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  
  // ファイル変更処理
  const handleFileChange = useCallback(async (newFiles: FileList | null) => {
    if (!newFiles || disabled) return;
    
    // ファイル配列に変換
    const filesArray = Array.from(newFiles);
    
    // 複数選択が無効の場合は最初のファイルのみ使用
    const filesToUse = multiple ? filesArray : [filesArray[0]];
    
    // ファイル数の制限
    const remainingSlots = maxFiles - value.length;
    const limitedFiles = filesToUse.slice(0, remainingSlots);
    
    // サイズの検証
    const validFiles = maxSize 
      ? limitedFiles.filter(file => file.size <= maxSize)
      : limitedFiles;
    
    if (validFiles.length < limitedFiles.length) {
      // サイズ制限でフィルタされたファイルがある場合の警告
      console.warn(`${limitedFiles.length - validFiles.length}個のファイルがサイズ制限を超えています`);
    }
    
    // 画像ファイルのプレビューを生成
    const newPreviews: Record<string, string> = {};
    for (const file of validFiles) {
      if (file.type.startsWith('image/')) {
        try {
          const preview = await createImagePreview(file);
          newPreviews[file.name] = preview;
        } catch (error) {
          console.error('プレビュー生成エラー:', error);
        }
      }
    }
    
    setFilePreviews(prev => ({ ...prev, ...newPreviews }));
    
    // アップロード進捗のシミュレーション（実際のアップロード時はこれを置き換え）
    if (onUploadProgress && validFiles.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);
      
      // 進捗のシミュレーション
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
    
    // 既存のファイルと新しいファイルを結合（複数の場合）
    const updatedFiles = multiple 
      ? [...value, ...validFiles].slice(0, maxFiles) 
      : validFiles;
    
    onChange(updatedFiles);
  }, [value, onChange, multiple, maxSize, maxFiles, disabled, onUploadProgress]);
  
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
    const removedFile = value[index];
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
    
    // プレビューを削除
    if (removedFile && filePreviews[removedFile.name]) {
      setFilePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[removedFile.name];
        return newPreviews;
      });
    }
  }, [value, onChange, disabled, filePreviews]);
  
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
            opacity: disabled ? 0.7 : 1,
            position: 'relative'
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
            disabled={disabled || isUploading}
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
                disabled={disabled || isUploading}
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
                最大{maxFiles}ファイルまで（残り{maxFiles - value.length}ファイル）
              </Typography>
            )}
            {accept && (
              <Typography variant="caption" display="block">
                対応形式: {accept.replace(/,/g, ', ')}
              </Typography>
            )}
          </label>
          
          {/* アップロード進捗バー */}
          {isUploading && (
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" align="center" display="block" sx={{ mt: 0.5 }}>
                アップロード中... {uploadProgress}%
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
      
      {value.length > 0 && (
        <List dense sx={{ mt: 1 }}>
          {value.map((file, index) => (
            <ListItem key={`${file.name}-${index}`} sx={{ py: 0.5 }}>
              <ListItemAvatar>
                <Avatar
                  variant="rounded"
                  src={filePreviews[file.name]}
                  sx={{ 
                    width: 48, 
                    height: 48,
                    bgcolor: filePreviews[file.name] ? 'transparent' : 'action.selected'
                  }}
                >
                  {!filePreviews[file.name] && getFileIcon(file.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={file.name}
                secondary={
                  <Box>
                    <Typography variant="caption" component="span">
                      {formatFileSize(file.size)}
                    </Typography>
                    {file.type && (
                      <Typography variant="caption" component="span" sx={{ ml: 1 }}>
                        • {file.type}
                      </Typography>
                    )}
                  </Box>
                }
                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  size="small" 
                  onClick={() => removeFile(index)}
                  disabled={disabled || isUploading}
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