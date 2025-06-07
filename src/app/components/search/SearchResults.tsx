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
import { 
  FiberNew as NewIcon,
  Sync as InProgressIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ClosedIcon,
  PriorityHigh as HighestPriorityIcon,
  ArrowUpward as HighPriorityIcon,
  Remove as MediumPriorityIcon,
  ArrowDownward as LowPriorityIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

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
  
  // ステータスに基づいて表示するアイコンとチップの色を取得
  const getStatusInfo = (status: Question['status']) => {
    switch (status) {
      case 'NEW':
        return { icon: <NewIcon />, color: 'info', label: '新規' };
      case 'IN_PROGRESS':
        return { icon: <InProgressIcon />, color: 'warning', label: '回答中' };
      case 'PENDING_APPROVAL':
        return { icon: <PendingIcon />, color: 'secondary', label: '承認待ち' };
      case 'CLOSED':
        return { icon: <ClosedIcon />, color: 'success', label: 'クローズ' };
      default:
        return { icon: null, color: 'default', label: '' };
    }
  };
  
  // 優先度に基づいて表示するアイコンとチップの色を取得
  const getPriorityInfo = (priority: Question['priority']) => {
    switch (priority) {
      case 'HIGHEST':
        return { icon: <HighestPriorityIcon />, color: 'error', label: '最高' };
      case 'HIGH':
        return { icon: <HighPriorityIcon />, color: 'warning', label: '高' };
      case 'MEDIUM':
        return { icon: <MediumPriorityIcon />, color: 'info', label: '中' };
      case 'LOW':
        return { icon: <LowPriorityIcon />, color: 'default', label: '低' };
      default:
        return { icon: null, color: 'default', label: '' };
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
        const status = getStatusInfo(question.status);
        const priority = getPriorityInfo(question.priority);
        
        return (
          <Box sx={{ py: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
              {question.title}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
              <Chip 
                size="small" 
                label={status.label} 
                color={status.color as any} 
                {...(status.icon ? { icon: status.icon } : {})}
              />
              <Chip 
                size="small" 
                label={priority.label} 
                color={priority.color as any} 
                {...(priority.icon ? { icon: priority.icon } : {})}
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
        const status = getStatusInfo(params.value as Question['status']);
        return (
          <Chip 
            size="small" 
            label={status.label} 
            color={status.color as any} 
            {...(status.icon ? { icon: status.icon } : {})}
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
        const priority = getPriorityInfo(params.value as Question['priority']);
        return (
          <Chip 
            size="small" 
            label={priority.label} 
            color={priority.color as any} 
            {...(priority.icon ? { icon: priority.icon } : {})}
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