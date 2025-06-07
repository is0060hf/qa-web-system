'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Typography,
  Chip,

  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/layout/DashboardLayout';
import DataTable from '../components/common/DataTable';
import { fetchData, useDataFetching } from '@/lib/utils/fetchData';
import { MockProject } from '@/mocks/projects';

// テーブルのカラム定義
const columns = [
  { id: 'name', label: 'プロジェクト名', minWidth: 170 },
  { id: 'description', label: '説明', minWidth: 250 },
  {
    id: 'members_count',
    label: 'メンバー数',
    minWidth: 100,
    align: 'right' as const,
  },
  {
    id: 'questions_count',
    label: '質問数',
    minWidth: 100,
    align: 'right' as const,
  },
  {
    id: 'status',
    label: 'ステータス',
    minWidth: 120,
    align: 'center' as const,
    format: (value: string) => {
      let color = '';
      switch (value) {
        case 'アクティブ':
          color = 'success';
          break;
        case '一時停止':
          color = 'warning';
          break;
        case '完了':
          color = 'info';
          break;
        default:
          color = 'default';
      }
      return <Chip label={value} color={color as any} size="small" />;
    },
  },
  {
    id: 'updatedAt',
    label: '最終更新日',
    minWidth: 120,
    format: (value: string) => new Date(value).toLocaleDateString('ja-JP'),
  },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('全て');

  // クエリパラメータの準備
  const getQueryParams = () => ({
    status: statusFilter !== '全て' ? statusFilter : '',
  });

  // プロジェクトデータの取得
  const { 
    data: projects, 
    isLoading, 
    error, 
    refetch 
  } = useDataFetching<MockProject[]>(
    () => fetchData<MockProject[]>('projects', { params: getQueryParams() }),
    []
  );
  
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  // フィルター値が変更されたらデータを再取得
  useEffect(() => {
    refetch();
  }, [statusFilter, refetch]);
  
  const handleRowClick = (row: any) => {
    router.push(`/projects/${row.id}`);
  };
  
  return (
    <DashboardLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          プロジェクト
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/projects/create')}
        >
          新規プロジェクト
        </Button>
      </Box>
      
      <Box sx={{ mb: 4, maxWidth: 400 }}>
        <FormControl fullWidth>
          <InputLabel id="status-filter-label">ステータス</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={statusFilter}
            label="ステータス"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="全て">全て</MenuItem>
            <MenuItem value="アクティブ">アクティブ</MenuItem>
            <MenuItem value="一時停止">一時停止</MenuItem>
            <MenuItem value="完了">完了</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <DataTable
          columns={columns}
          data={projects}
          title="プロジェクト一覧"
          searchPlaceholder="プロジェクトを検索..."
          onRowClick={handleRowClick}
        />
      )}
    </DashboardLayout>
  );
} 