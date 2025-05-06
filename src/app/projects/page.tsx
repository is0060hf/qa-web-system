'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Typography,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/layout/DashboardLayout';
import DataTable from '../components/common/DataTable';

// モックデータ
const mockProjects = [
  {
    id: 'proj1',
    name: 'プロジェクトA',
    description: 'ウェブアプリケーションの開発プロジェクト',
    members: 5,
    questions: 12,
    status: 'アクティブ',
    updatedAt: '2023-08-01',
  },
  {
    id: 'proj2',
    name: 'プロジェクトB',
    description: 'モバイルアプリの開発と保守',
    members: 8,
    questions: 24,
    status: 'アクティブ',
    updatedAt: '2023-07-28',
  },
  {
    id: 'proj3',
    name: 'プロジェクトC',
    description: 'レガシーシステムの刷新',
    members: 12,
    questions: 45,
    status: 'アクティブ',
    updatedAt: '2023-07-25',
  },
  {
    id: 'proj4',
    name: 'プロジェクトD',
    description: 'マーケティングサイトのリニューアル',
    members: 3,
    questions: 8,
    status: '完了',
    updatedAt: '2023-06-15',
  },
  {
    id: 'proj5',
    name: 'プロジェクトE',
    description: 'インフラ構築と移行',
    members: 4,
    questions: 16,
    status: '一時停止',
    updatedAt: '2023-07-10',
  },
];

// テーブルのカラム定義
const columns = [
  { id: 'name', label: 'プロジェクト名', minWidth: 170 },
  { id: 'description', label: '説明', minWidth: 250 },
  {
    id: 'members',
    label: 'メンバー数',
    minWidth: 100,
    align: 'right' as const,
  },
  {
    id: 'questions',
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
  
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };
  
  const handleRowClick = (row: any) => {
    router.push(`/projects/${row.id}`);
  };
  
  const filteredProjects = statusFilter === '全て'
    ? mockProjects
    : mockProjects.filter(project => project.status === statusFilter);
  
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
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
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
        </Grid>
      </Grid>
      
      <DataTable
        columns={columns}
        data={filteredProjects}
        title="プロジェクト一覧"
        searchPlaceholder="プロジェクトを検索..."
        onRowClick={handleRowClick}
      />
    </DashboardLayout>
  );
} 