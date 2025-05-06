'use client';

import { useState, useEffect } from 'react';
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
  Avatar,
  AvatarGroup,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  QuestionAnswer as QuestionAnswerIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/layout/DashboardLayout';
import DataTable from '../components/common/DataTable';
import { fetchData, useDataFetching } from '@/lib/utils/fetchData';
import { MockQuestion } from '@/mocks/questions';

// テーブルのカラム定義
const columns = [
  { 
    id: 'title', 
    label: '質問タイトル', 
    minWidth: 250,
    format: (value: string, row: any) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <QuestionAnswerIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="body2" fontWeight="500">
          {value}
        </Typography>
      </Box>
    ),
  },
  { 
    id: 'project', 
    label: 'プロジェクト', 
    minWidth: 150,
  },
  {
    id: 'assignees',
    label: '担当者',
    minWidth: 150,
    format: (value: any[]) => (
      <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
        {value.map((user) => (
          <Tooltip key={user.id} title={user.name}>
            <Avatar
              sx={{ width: 28, height: 28, fontSize: '0.875rem' }}
            >
              {user.name.charAt(0)}
            </Avatar>
          </Tooltip>
        ))}
      </AvatarGroup>
    ),
  },
  {
    id: 'status',
    label: 'ステータス',
    minWidth: 120,
    align: 'center' as const,
    format: (value: string) => {
      let color = '';
      switch (value) {
        case '回答中':
          color = 'primary';
          break;
        case '承認待ち':
          color = 'warning';
          break;
        case 'クローズ':
          color = 'success';
          break;
        default:
          color = 'default';
      }
      return <Chip label={value} color={color as any} size="small" />;
    },
  },
  {
    id: 'priority',
    label: '優先度',
    minWidth: 80,
    align: 'center' as const,
    format: (value: string) => {
      let color = '';
      switch (value) {
        case '高':
          color = 'error';
          break;
        case '中':
          color = 'warning';
          break;
        case '低':
          color = 'info';
          break;
        default:
          color = 'default';
      }
      return <Chip label={value} color={color as any} size="small" variant="outlined" />;
    },
  },
  {
    id: 'deadline',
    label: '回答期限',
    minWidth: 120,
    format: (value: string) => {
      const deadline = new Date(value);
      const now = new Date();
      const isExpired = deadline < now;
      const isNearDeadline = !isExpired && deadline.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000; // 3日以内
      
      return (
        <Typography
          variant="body2"
          color={isExpired ? 'error' : isNearDeadline ? 'warning.main' : 'text.primary'}
          fontWeight={isExpired || isNearDeadline ? 'medium' : 'regular'}
        >
          {new Date(value).toLocaleDateString('ja-JP')}
        </Typography>
      );
    },
  },
  {
    id: 'updatedAt',
    label: '最終更新日',
    minWidth: 120,
    format: (value: string) => new Date(value).toLocaleDateString('ja-JP'),
  },
];

export default function QuestionsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('全て');
  const [projectFilter, setProjectFilter] = useState<string>('全て');
  const [projects, setProjects] = useState<string[]>([]);
  
  // クエリパラメータの準備
  const getQueryParams = () => ({
    status: statusFilter !== '全て' ? statusFilter : '',
    project: projectFilter !== '全て' ? projectFilter : '',
  });

  // 質問データの取得
  const { 
    data: questions, 
    isLoading, 
    error, 
    refetch
  } = useDataFetching<MockQuestion[]>(
    () => fetchData<MockQuestion[]>('questions', { params: getQueryParams() }),
    []
  );
  
  // プロジェクト一覧の生成 (フィルタ用)
  useEffect(() => {
    if (questions.length > 0) {
      const uniqueProjects = [...new Set(questions.map(q => q.project))];
      setProjects(uniqueProjects);
    }
  }, [questions]);
  
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };
  
  const handleProjectFilterChange = (event: SelectChangeEvent) => {
    setProjectFilter(event.target.value);
  };

  // フィルター値が変更されたらデータを再取得
  useEffect(() => {
    refetch();
  }, [statusFilter, projectFilter, refetch]);
  
  const handleRowClick = (row: any) => {
    router.push(`/questions/${row.id}`);
  };
  
  return (
    <DashboardLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          質問管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/questions/create')}
        >
          新規質問
        </Button>
      </Box>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid container item xs={12} md={4}>
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
              <MenuItem value="回答中">回答中</MenuItem>
              <MenuItem value="承認待ち">承認待ち</MenuItem>
              <MenuItem value="クローズ">クローズ</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid container item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="project-filter-label">プロジェクト</InputLabel>
            <Select
              labelId="project-filter-label"
              id="project-filter"
              value={projectFilter}
              label="プロジェクト"
              onChange={handleProjectFilterChange}
            >
              <MenuItem value="全て">全て</MenuItem>
              {projects.map(project => (
                <MenuItem key={project} value={project}>{project}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
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
          data={questions}
          title="質問一覧"
          searchPlaceholder="質問を検索..."
          onRowClick={handleRowClick}
        />
      )}
    </DashboardLayout>
  );
} 