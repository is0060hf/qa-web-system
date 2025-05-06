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
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  QuestionAnswer as QuestionAnswerIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/layout/DashboardLayout';
import DataTable from '../components/common/DataTable';

// モックデータ
const mockQuestions = [
  {
    id: 'q1',
    title: 'ログイン機能の実装について',
    project: 'プロジェクトA',
    project_id: 'proj1',
    status: '回答中',
    priority: '高',
    assignees: [
      { id: 'user1', name: '鈴木 一郎', avatar: '' },
      { id: 'user2', name: '佐藤 二郎', avatar: '' },
    ],
    createdBy: 'user3',
    createdByName: '田中 三郎',
    deadline: '2023-08-15',
    createdAt: '2023-07-25',
    updatedAt: '2023-08-01',
  },
  {
    id: 'q2',
    title: 'APIのレスポンス形式の統一',
    project: 'プロジェクトA',
    project_id: 'proj1',
    status: '承認待ち',
    priority: '中',
    assignees: [
      { id: 'user3', name: '田中 三郎', avatar: '' },
    ],
    createdBy: 'user2',
    createdByName: '佐藤 二郎',
    deadline: '2023-08-20',
    createdAt: '2023-07-28',
    updatedAt: '2023-07-30',
  },
  {
    id: 'q3',
    title: 'デザインガイドラインの適用方法',
    project: 'プロジェクトB',
    project_id: 'proj2',
    status: 'クローズ',
    priority: '低',
    assignees: [
      { id: 'user4', name: '高橋 四郎', avatar: '' },
    ],
    createdBy: 'user1',
    createdByName: '鈴木 一郎',
    deadline: '2023-07-25',
    createdAt: '2023-07-15',
    updatedAt: '2023-07-23',
  },
  {
    id: 'q4',
    title: 'テストケースの追加について',
    project: 'プロジェクトA',
    project_id: 'proj1',
    status: '回答中',
    priority: '中',
    assignees: [
      { id: 'user5', name: '伊藤 五郎', avatar: '' },
      { id: 'user1', name: '鈴木 一郎', avatar: '' },
    ],
    createdBy: 'user2',
    createdByName: '佐藤 二郎',
    deadline: '2023-08-25',
    createdAt: '2023-08-01',
    updatedAt: '2023-08-02',
  },
  {
    id: 'q5',
    title: 'パフォーマンス最適化の方法',
    project: 'プロジェクトC',
    project_id: 'proj3',
    status: '承認待ち',
    priority: '高',
    assignees: [
      { id: 'user3', name: '田中 三郎', avatar: '' },
      { id: 'user4', name: '高橋 四郎', avatar: '' },
    ],
    createdBy: 'user5',
    createdByName: '伊藤 五郎',
    deadline: '2023-09-01',
    createdAt: '2023-08-05',
    updatedAt: '2023-08-10',
  },
];

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
  
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };
  
  const handleProjectFilterChange = (event: SelectChangeEvent) => {
    setProjectFilter(event.target.value);
  };
  
  const handleRowClick = (row: any) => {
    router.push(`/questions/${row.id}`);
  };
  
  // フィルタリング
  let filteredQuestions = [...mockQuestions];
  
  if (statusFilter !== '全て') {
    filteredQuestions = filteredQuestions.filter(q => q.status === statusFilter);
  }
  
  if (projectFilter !== '全て') {
    filteredQuestions = filteredQuestions.filter(q => q.project === projectFilter);
  }
  
  // プロジェクト一覧（フィルタ用）
  const projects = [...new Set(mockQuestions.map(q => q.project))];
  
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
              <MenuItem value="回答中">回答中</MenuItem>
              <MenuItem value="承認待ち">承認待ち</MenuItem>
              <MenuItem value="クローズ">クローズ</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
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
      
      <DataTable
        columns={columns}
        data={filteredQuestions}
        title="質問一覧"
        searchPlaceholder="質問を検索..."
        onRowClick={handleRowClick}
      />
    </DashboardLayout>
  );
} 