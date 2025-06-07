'use client';

import React from 'react';
import { 
  Box, 
  Paper, 
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Pagination,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getStatusChipColor, getPriorityChipColor } from '@/lib/utils/muiHelpers';

// 質問の型定義
export interface Question {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  status: 'NEW' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'CLOSED';
  assigneeId: string;
  assigneeName: string;
  creatorId: string;
  creatorName: string;
  priority: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';
  deadline: string | null;
  tags: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

// 検索結果のプロパティ
interface SearchResultsProps {
  questions: Question[];
  total: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error?: string;
  onPageChange: (page: number) => void;
  onQuestionClick: (question: Question) => void;
}

export default function SearchResults({
  questions,
  total,
  currentPage,
  pageSize,
  isLoading,
  error,
  onPageChange,
  onQuestionClick
}: SearchResultsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // ステータスに基づいて表示するラベルを取得
  const getStatusLabel = (status: Question['status']) => {
    switch (status) {
      case 'NEW':
        return '新規';
      case 'IN_PROGRESS':
        return '回答中';
      case 'PENDING_APPROVAL':
        return '承認待ち';
      case 'CLOSED':
        return 'クローズ';
      default:
        return '';
    }
  };
  
  // 優先度に基づいて表示するラベルを取得
  const getPriorityLabel = (priority: Question['priority']) => {
    switch (priority) {
      case 'HIGHEST':
        return '最高';
      case 'HIGH':
        return '高';
      case 'MEDIUM':
        return '中';
      case 'LOW':
        return '低';
      default:
        return '';
    }
  };
  
  // モバイル表示用の列定義
  const mobileColumns: GridColDef[] = [
    {
      field: 'title',
      headerName: '質問',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Question>) => {
        const question = params.row;
        
        return (
          <Box sx={{ py: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
              {question.title}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
              <Chip 
                size="small" 
                label={getStatusLabel(question.status)} 
                color={getStatusChipColor(question.status)} 
              />
              <Chip 
                size="small" 
                label={getPriorityLabel(question.priority)} 
                color={getPriorityChipColor(question.priority)} 
                variant="outlined"
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              プロジェクト: {question.projectName} | 
              担当: {question.assigneeName} | 
              {question.deadline && `期限: ${format(new Date(question.deadline), 'yyyy/MM/dd', { locale: ja })}`}
            </Typography>
          </Box>
        );
      }
    }
  ];
  
  // デスクトップ表示用の列定義
  const desktopColumns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'タイトル',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'projectName',
      headerName: 'プロジェクト',
      width: 150,
    },
    {
      field: 'status',
      headerName: 'ステータス',
      width: 120,
      renderCell: (params: GridRenderCellParams<Question>) => {
        return (
          <Chip 
            size="small" 
            label={getStatusLabel(params.value as Question['status'])} 
            color={getStatusChipColor(params.value as Question['status'])} 
          />
        );
      }
    },
    {
      field: 'assigneeName',
      headerName: '担当者',
      width: 120,
    },
    {
      field: 'priority',
      headerName: '優先度',
      width: 100,
      renderCell: (params: GridRenderCellParams<Question>) => {
        return (
          <Chip 
            size="small" 
            label={getPriorityLabel(params.value as Question['priority'])} 
            color={getPriorityChipColor(params.value as Question['priority'])} 
            variant="outlined"
          />
        );
      }
    },
    {
      field: 'deadline',
      headerName: '期限',
      width: 120,
      valueFormatter: (value) => {
        if (!value) return '期限なし';
        return format(new Date(value as string), 'yyyy/MM/dd', { locale: ja });
      },
    },
    {
      field: 'createdAt',
      headerName: '作成日時',
      width: 150,
      valueFormatter: (value) => {
        return format(new Date(value as string), 'yyyy/MM/dd HH:mm', { locale: ja });
      },
    }
  ];
  
  // ページ数の計算
  const totalPages = Math.ceil(total / pageSize);
  
  // 質問の行をクリックした時のハンドラ
  const handleRowClick = (params: any) => {
    const question = questions.find(q => q.id === params.id);
    if (question) {
      onQuestionClick(question);
    }
  };

  return (
    <Paper sx={{ p: 0, mb: 3 }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      ) : questions.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            検索条件に一致する質問はありません
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ height: 'auto', width: '100%' }}>
            <DataGrid
              rows={questions}
              columns={isMobile ? mobileColumns : desktopColumns}
              getRowId={(row) => row.id}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[]}
              onRowClick={handleRowClick}
              hideFooter
              paginationModel={{
                page: currentPage - 1,
                pageSize
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  cursor: 'pointer'
                }
              }}
            />
          </Box>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => onPageChange(page)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Paper>
  );
} 