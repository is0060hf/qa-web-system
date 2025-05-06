'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Paper,
  Typography,
  Collapse,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FormSelectField, { SelectOption } from '../common/FormSelectField';

// 質問ステータスの選択肢
const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'すべて' },
  { value: 'NEW', label: '新規' },
  { value: 'IN_PROGRESS', label: '回答中' },
  { value: 'PENDING_APPROVAL', label: '承認待ち' },
  { value: 'CLOSED', label: 'クローズ' }
];

// 優先度の選択肢
const PRIORITY_OPTIONS: SelectOption[] = [
  { value: '', label: 'すべて' },
  { value: 'HIGHEST', label: '最高' },
  { value: 'HIGH', label: '高' },
  { value: 'MEDIUM', label: '中' },
  { value: 'LOW', label: '低' }
];

// 検索フォームのプロパティ
interface SearchFormProps {
  onSearch: (searchParams: SearchParams) => void;
  projects?: SelectOption[];
  assignees?: SelectOption[];
  tags?: SelectOption[];
  initialParams?: Partial<SearchParams>;
  isLoading?: boolean;
}

// 検索パラメータの型定義
export interface SearchParams {
  keyword: string;
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  tagId?: string;
  isDeadlineExpired?: boolean;
}

export default function SearchForm({ 
  onSearch, 
  projects = [], 
  assignees = [], 
  tags = [],
  initialParams = {}, 
  isLoading = false 
}: SearchFormProps) {
  // 検索条件の状態
  const [searchParams, setSearchParams] = useState<SearchParams>({
    keyword: initialParams.keyword || '',
    projectId: initialParams.projectId || '',
    assigneeId: initialParams.assigneeId || '',
    status: initialParams.status || '',
    priority: initialParams.priority || '',
    tagId: initialParams.tagId || '',
    isDeadlineExpired: initialParams.isDeadlineExpired || false
  });
  
  // 詳細検索の表示状態
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // 入力フィールド変更ハンドラ
  const handleChange = (field: keyof SearchParams, value: string | boolean) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // キーワード変更ハンドラ
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange('keyword', e.target.value);
  };
  
  // キーワードクリアハンドラ
  const handleClearKeyword = () => {
    handleChange('keyword', '');
  };
  
  // 検索条件クリアハンドラ
  const handleClearAll = () => {
    setSearchParams({
      keyword: '',
      projectId: '',
      assigneeId: '',
      status: '',
      priority: '',
      tagId: '',
      isDeadlineExpired: false
    });
  };
  
  // 検索実行ハンドラ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchParams);
  };
  
  // エンターキーでの検索
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* キーワード検索フィールド */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="質問のタイトル、内容、回答を検索"
            value={searchParams.keyword}
            onChange={handleKeywordChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchParams.keyword ? (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={handleClearKeyword}
                    disabled={isLoading}
                    size="small"
                    aria-label="キーワードをクリア"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
        </Box>
        
        {/* 詳細検索トグル */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button
            startIcon={<FilterListIcon />}
            endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowAdvanced(!showAdvanced)}
            color="inherit"
            size="small"
          >
            詳細検索
          </Button>
          
          <Box>
            <Button
              variant="outlined"
              onClick={handleClearAll}
              disabled={isLoading}
              sx={{ mr: 1 }}
            >
              クリア
            </Button>
            <Button
              variant="contained"
              type="submit"
              startIcon={<SearchIcon />}
              disabled={isLoading}
            >
              検索
            </Button>
          </Box>
        </Box>
        
        {/* 詳細検索フィルター */}
        <Collapse in={showAdvanced}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* プロジェクト */}
            <Grid item xs={12} md={6}>
              <FormSelectField
                name="projectId"
                label="プロジェクト"
                value={searchParams.projectId}
                onChange={(e) => handleChange('projectId', e.target.value)}
                options={[
                  { value: '', label: 'すべてのプロジェクト' },
                  ...projects
                ]}
                fullWidth
                size="small"
                disabled={isLoading}
              />
            </Grid>
            
            {/* 担当者 */}
            <Grid item xs={12} md={6}>
              <FormSelectField
                name="assigneeId"
                label="担当者"
                value={searchParams.assigneeId}
                onChange={(e) => handleChange('assigneeId', e.target.value)}
                options={[
                  { value: '', label: 'すべての担当者' },
                  ...assignees
                ]}
                fullWidth
                size="small"
                disabled={isLoading}
              />
            </Grid>
            
            {/* ステータス */}
            <Grid item xs={12} md={6}>
              <FormSelectField
                name="status"
                label="ステータス"
                value={searchParams.status}
                onChange={(e) => handleChange('status', e.target.value)}
                options={STATUS_OPTIONS}
                fullWidth
                size="small"
                disabled={isLoading}
              />
            </Grid>
            
            {/* 優先度 */}
            <Grid item xs={12} md={6}>
              <FormSelectField
                name="priority"
                label="優先度"
                value={searchParams.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                options={PRIORITY_OPTIONS}
                fullWidth
                size="small"
                disabled={isLoading}
              />
            </Grid>
            
            {/* タグ */}
            {tags.length > 0 && (
              <Grid item xs={12} md={6}>
                <FormSelectField
                  name="tagId"
                  label="タグ"
                  value={searchParams.tagId}
                  onChange={(e) => handleChange('tagId', e.target.value)}
                  options={[
                    { value: '', label: 'すべてのタグ' },
                    ...tags
                  ]}
                  fullWidth
                  size="small"
                  disabled={isLoading}
                />
              </Grid>
            )}
            
            {/* 期限切れフラグ */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={searchParams.isDeadlineExpired}
                    onChange={(e) => handleChange('isDeadlineExpired', e.target.checked)}
                    disabled={isLoading}
                  />
                }
                label="期限切れの質問のみ表示"
              />
            </Grid>
          </Grid>
        </Collapse>
      </Box>
    </Paper>
  );
} 