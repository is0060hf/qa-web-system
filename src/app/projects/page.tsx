'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { getProjectStatusChipColor } from '@/lib/utils/muiHelpers';

// APIレスポンスの型定義
interface ProjectAPIResponse {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  members?: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  _count?: {
    questions: number;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

// 変換後のデータ型
interface ProjectWithCounts extends Omit<ProjectAPIResponse, '_count'> {
  members_count: number;
  questions_count: number;
}

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
      return <Chip label={value} color={getProjectStatusChipColor(value)} size="small" />;
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
    data: rawProjects, 
    isLoading, 
    error, 
    refetch 
  } = useDataFetching<ProjectAPIResponse[]>(
    () => fetchData<ProjectAPIResponse[]>('projects', { params: getQueryParams() }),
    []
  );
  
  // APIレスポンスのデータを画面用に変換（メモ化）
  const projects: ProjectWithCounts[] = useMemo(() => 
    rawProjects?.map((project) => ({
      ...project,
      members_count: project.members?.length ?? 0,
      questions_count: project._count?.questions ?? 0,
    })) ?? []
  , [rawProjects]);
  
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