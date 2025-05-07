'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Avatar,
  AvatarGroup,
  SelectChangeEvent,
} from '@mui/material';
import {
  QuestionAnswer as QuestionAnswerIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ja from 'date-fns/locale/ja';
import { format, isPast, isWithinDays } from 'date-fns';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/common/DataTable';
import { fetchData } from '@/lib/utils/fetchData';

// 質問の型定義
interface Question {
  id: string;
  title: string;
  projectName: string;
  status: 'NEW' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'CLOSED';
  priority: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
  };
}

// プロジェクトの型定義
interface Project {
  id: string;
  name: string;
}

// ステータスのマッピング
const statusMapping = {
  NEW: '新規',
  IN_PROGRESS: '回答中',
  PENDING_APPROVAL: '承認待ち',
  CLOSED: 'クローズ',
};

// 優先度のマッピング
const priorityMapping = {
  HIGHEST: '最高',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
};

// カラム定義
const columns = [
  { 
    id: 'title', 
    label: '質問タイトル', 
    minWidth: 250,
    format: (value: string, row: Question) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <QuestionAnswerIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="body2" fontWeight="500">
          {value}
        </Typography>
      </Box>
    ),
  },
  { 
    id: 'projectName', 
    label: 'プロジェクト', 
    minWidth: 150,
  },
  {
    id: 'creator',
    label: '質問者',
    minWidth: 120,
    format: (value: { id: string; name: string }) => (
      <Tooltip title={value.name}>
        <Avatar sx={{ width: 28, height: 28, fontSize: '0.875rem' }}>
          {value.name.charAt(0)}
        </Avatar>
      </Tooltip>
    ),
  },
  {
    id: 'status',
    label: 'ステータス',
    minWidth: 120,
    align: 'center' as const,
    format: (value: 'NEW' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'CLOSED') => {
      let color = '';
      switch (value) {
        case 'NEW':
          color = 'info';
          break;
        case 'IN_PROGRESS':
          color = 'primary';
          break;
        case 'PENDING_APPROVAL':
          color = 'warning';
          break;
        case 'CLOSED':
          color = 'success';
          break;
        default:
          color = 'default';
      }
      return <Chip label={statusMapping[value]} color={color as any} size="small" />;
    },
  },
  {
    id: 'priority',
    label: '優先度',
    minWidth: 80,
    align: 'center' as const,
    format: (value: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW') => {
      let color = '';
      switch (value) {
        case 'HIGHEST':
          color = 'error';
          break;
        case 'HIGH':
          color = 'error';
          break;
        case 'MEDIUM':
          color = 'warning';
          break;
        case 'LOW':
          color = 'info';
          break;
        default:
          color = 'default';
      }
      return <Chip label={priorityMapping[value]} color={color as any} size="small" variant="outlined" />;
    },
  },
  {
    id: 'deadline',
    label: '回答期限',
    minWidth: 120,
    format: (value: string | null) => {
      if (!value) return '-';
      
      const deadline = new Date(value);
      const now = new Date();
      const isExpired = isPast(deadline);
      const isNearDeadline = !isExpired && isWithinDays(deadline, now, 3); // 3日以内
      
      return (
        <Typography
          variant="body2"
          color={isExpired ? 'error' : isNearDeadline ? 'warning.main' : 'text.primary'}
          fontWeight={isExpired || isNearDeadline ? 'medium' : 'regular'}
        >
          {format(deadline, 'yyyy/MM/dd')}
        </Typography>
      );
    },
  },
  {
    id: 'updatedAt',
    label: '最終更新日',
    minWidth: 120,
    format: (value: string) => format(new Date(value), 'yyyy/MM/dd'),
  },
];

export default function AssignedQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // フィルター状態
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  
  // データ取得
  useEffect(() => {
    const fetchAssignedQuestions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // クエリパラメータの作成
        const params = new URLSearchParams();
        
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (priorityFilter !== 'all') params.append('priority', priorityFilter);
        if (projectFilter !== 'all') params.append('projectId', projectFilter);
        if (deadlineFilter === 'expired') params.append('isDeadlineExpired', 'true');
        
        // 担当中の質問を取得
        const questionsData = await fetchData<Question[]>('questions/assigned-to-me', { params });
        setQuestions(questionsData);
        
        // プロジェクト一覧を取得（フィルター用）
        const projectsData = await fetchData<Project[]>('projects');
        setProjects(projectsData);
        
        setLoading(false);
      } catch (err: any) {
        setError('質問データの取得に失敗しました: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchAssignedQuestions();
  }, [searchTerm, statusFilter, priorityFilter, projectFilter, deadlineFilter]);
  
  // フィルター変更ハンドラー
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };
  
  const handlePriorityFilterChange = (event: SelectChangeEvent) => {
    setPriorityFilter(event.target.value);
  };
  
  const handleProjectFilterChange = (event: SelectChangeEvent) => {
    setProjectFilter(event.target.value);
  };
  
  const handleDeadlineFilterChange = (event: SelectChangeEvent) => {
    setDeadlineFilter(event.target.value);
  };
  
  // 行クリック時のハンドラー
  const handleRowClick = (row: Question) => {
    router.push(`/questions/${row.id}`);
  };
  
  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          担当中の質問一覧
        </Typography>
        <Typography variant="body1" color="text.secondary">
          あなたが担当者として割り当てられている質問の一覧です。
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterListIcon sx={{ mr: 1 }} />
            検索・フィルター
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="キーワード検索"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="タイトルや内容で検索..."
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>プロジェクト</InputLabel>
              <Select
                value={projectFilter}
                onChange={handleProjectFilterChange}
                label="プロジェクト"
              >
                <MenuItem value="all">全て</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>ステータス</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="ステータス"
              >
                <MenuItem value="all">全て</MenuItem>
                <MenuItem value="NEW">新規</MenuItem>
                <MenuItem value="IN_PROGRESS">回答中</MenuItem>
                <MenuItem value="PENDING_APPROVAL">承認待ち</MenuItem>
                <MenuItem value="CLOSED">クローズ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>優先度</InputLabel>
              <Select
                value={priorityFilter}
                onChange={handlePriorityFilterChange}
                label="優先度"
              >
                <MenuItem value="all">全て</MenuItem>
                <MenuItem value="HIGHEST">最高</MenuItem>
                <MenuItem value="HIGH">高</MenuItem>
                <MenuItem value="MEDIUM">中</MenuItem>
                <MenuItem value="LOW">低</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>期限</InputLabel>
              <Select
                value={deadlineFilter}
                onChange={handleDeadlineFilterChange}
                label="期限"
              >
                <MenuItem value="all">全て</MenuItem>
                <MenuItem value="expired">期限切れ</MenuItem>
                <MenuItem value="this-week">今週中</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      ) : (
        <DataTable
          columns={columns}
          data={questions}
          title="担当中の質問"
          searchPlaceholder="質問を検索..."
          onRowClick={handleRowClick}
          initialSortBy="deadline"
          initialSortDirection="asc"
          emptyMessage="担当中の質問はありません"
        />
      )}
    </DashboardLayout>
  );
} 