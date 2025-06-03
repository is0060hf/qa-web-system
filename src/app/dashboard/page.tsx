'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
  Button,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  HourglassTop as HourglassTopIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/layout/DashboardLayout';
import { fetchData, useDataFetching } from '@/lib/utils/fetchData';
import {
  AssignedQuestion,
  CreatedQuestion,
  RecentProject,
  MockDashboardData
} from '@/mocks/dashboard';

// StatCardの型定義
interface StatCardProps {
  title: string;
  value: number;
  description: string;
  bgcolor: string;
}

// 統計情報カードコンポーネント - メモ化して再レンダリングを防止
const StatCard = React.memo<StatCardProps>(({ title, value, description, bgcolor }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      height: 140,
      borderRadius: 2,
      bgcolor,
      color: 'white',
    }}
  >
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h3" component="div" sx={{ mt: 'auto' }}>
      {value}
    </Typography>
    <Typography variant="body2" sx={{ mt: 1 }}>
      {description}
    </Typography>
  </Paper>
));

StatCard.displayName = 'StatCard';

export default function Dashboard() {
  // データフェッチング関数をメモ化して安定させる
  const fetchDashboardData = useCallback(() => {
    return fetchData<MockDashboardData>('dashboard');
  }, []);
  
  // ダッシュボードデータの取得
  const { 
    data, 
    isLoading, 
    error
  } = useDataFetching<MockDashboardData>(
    fetchDashboardData,
    {
      stats: {
        assignedQuestions: 0,
        completedQuestions: 0,
        nearDeadlineQuestions: 0,
        overdueQuestions: 0,
      },
      assignedQuestions: [],
      createdQuestions: [],
      recentProjects: [],
    }
  );
  
  // データを変更しない場合はメモ化して再計算を防止
  const { stats, assignedQuestions, createdQuestions, recentProjects } = useMemo(() => data, [data]);
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ダッシュボード
        </Typography>
        <Typography variant="body1" color="text.secondary">
          質問の管理と回答の確認ができます
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 統計カード */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="割り当て質問"
            value={stats.assignedQuestions}
            description={`回答が必要な質問: ${stats.assignedQuestions}件`}
            bgcolor="primary.light"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="完了質問"
            value={stats.completedQuestions}
            description={`これまでに回答した質問: ${stats.completedQuestions}件`}
            bgcolor="success.light"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="期限間近"
            value={stats.nearDeadlineQuestions}
            description={`期限が3日以内の質問: ${stats.nearDeadlineQuestions}件`}
            bgcolor="warning.light"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="期限超過"
            value={stats.overdueQuestions}
            description={`期限を過ぎた質問: ${stats.overdueQuestions}件`}
            bgcolor="error.light"
          />
        </Grid>

        {/* 担当質問 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardHeader 
              title="担当質問" 
              action={
                <Button href="/questions/assigned" variant="text" color="primary">
                  すべて見る
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {assignedQuestions.length > 0 ? (
                <List>
                  {assignedQuestions.map((question, index) => (
                    <Box key={question.id}>
                      <ListItemButton
                        component="a" 
                        href={`/questions/${question.id}`}
                        sx={{ 
                          px: 3, 
                          py: 2,
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } 
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Badge 
                                color={
                                  new Date(question.deadline) < new Date() 
                                    ? 'error' 
                                    : new Date(question.deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) 
                                      ? 'warning' 
                                      : 'primary'
                                }
                                variant="dot"
                                sx={{ mr: 1 }}
                              >
                                <AssignmentIcon />
                              </Badge>
                              <Typography variant="subtitle1">{question.title}</Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" component="span">
                                  {question.project}
                                </Typography>
                                <Chip 
                                  label={question.status} 
                                  size="small" 
                                  color="primary"
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                              <Typography variant="body2" component="span">
                                期限: {new Date(question.deadline).toLocaleDateString('ja-JP')}
                              </Typography>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItemButton>
                      {index < assignedQuestions.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    担当している質問はありません
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 作成質問 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardHeader 
              title="作成質問" 
              action={
                <Button href="/questions/created" variant="text" color="primary">
                  すべて見る
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {createdQuestions.length > 0 ? (
                <List>
                  {createdQuestions.map((question, index) => (
                    <Box key={question.id}>
                      <ListItemButton
                        component="a" 
                        href={`/questions/${question.id}`}
                        sx={{ 
                          px: 3, 
                          py: 2,
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } 
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Badge 
                                color={
                                  question.status === 'クローズ' 
                                    ? 'success' 
                                    : question.status === '承認待ち' 
                                      ? 'warning' 
                                      : 'primary'
                                }
                                variant="dot"
                                sx={{ mr: 1 }}
                              >
                                <AssignmentIcon />
                              </Badge>
                              <Typography variant="subtitle1">{question.title}</Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" component="span">
                                  {question.project}
                                </Typography>
                                <Chip 
                                  label={question.status} 
                                  size="small" 
                                  color={
                                    question.status === 'クローズ' 
                                      ? 'success' 
                                      : question.status === '承認待ち' 
                                        ? 'warning' 
                                        : 'primary'
                                  }
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                              <Typography variant="body2" component="span">
                                作成日: {new Date(question.createdAt).toLocaleDateString('ja-JP')}
                              </Typography>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItemButton>
                      {index < createdQuestions.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    作成した質問はありません
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 最近のプロジェクト */}
        <Grid size={12}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardHeader 
              title="最近のプロジェクト" 
              action={
                <Button href="/projects" variant="text" color="primary">
                  すべて見る
                </Button>
              }
            />
            <Divider />
            {recentProjects.length > 0 ? (
              <Grid container sx={{ p: 2 }}>
                {recentProjects.map((project) => (
                  <Grid key={project.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        m: 1, 
                        p: 2, 
                        borderRadius: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        transition: 'all 0.3s',
                        '&:hover': {
                          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                          borderColor: 'primary.main',
                        }
                      }}
                      component="a"
                      href={`/projects/${project.id}`}
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <Typography variant="h6" gutterBottom>
                        {project.name}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          質問: {project.questionsCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          回答: {project.answersCount}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  最近のプロジェクトはありません
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
} 