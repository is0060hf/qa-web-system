'use client';

import { useState } from 'react';
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
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  HourglassTop as HourglassTopIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/layout/DashboardLayout';

// サンプルデータ
const assignedQuestions = [
  {
    id: '1',
    title: 'プロジェクトXで発生したエラーについて',
    project: 'プロジェクトX',
    deadline: '2023-08-15',
    status: '回答中',
  },
  {
    id: '2',
    title: 'デプロイパイプラインのトラブルシューティング',
    project: 'プロジェクトY',
    deadline: '2023-08-20',
    status: '回答中',
  },
];

const createdQuestions = [
  {
    id: '3',
    title: '新規機能の実装方法について',
    project: 'プロジェクトZ',
    createdAt: '2023-08-01',
    status: '承認待ち',
  },
  {
    id: '4',
    title: 'パフォーマンス最適化の方法',
    project: 'プロジェクトX',
    createdAt: '2023-08-05',
    status: 'クローズ',
  },
];

const recentProjects = [
  { id: '1', name: 'プロジェクトX', questionsCount: 10, answersCount: 8 },
  { id: '2', name: 'プロジェクトY', questionsCount: 5, answersCount: 3 },
  { id: '3', name: 'プロジェクトZ', questionsCount: 7, answersCount: 5 },
];

export default function Dashboard() {
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
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderRadius: 2,
              bgcolor: 'primary.light',
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>
              割り当て質問
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 'auto' }}>
              2
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              回答が必要な質問: 2件
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderRadius: 2,
              bgcolor: 'success.light',
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>
              完了質問
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 'auto' }}>
              15
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              これまでに回答した質問: 15件
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderRadius: 2,
              bgcolor: 'warning.light',
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>
              期限間近
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 'auto' }}>
              1
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              期限が3日以内の質問: 1件
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderRadius: 2,
              bgcolor: 'error.light',
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>
              期限超過
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 'auto' }}>
              0
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              期限を過ぎた質問: 0件
            </Typography>
          </Paper>
        </Grid>

        {/* 担当質問 */}
        <Grid item xs={12} md={6}>
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
                            <Box>
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
                            <Typography variant="body2">
                              期限: {new Date(question.deadline).toLocaleDateString('ja-JP')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    {index < assignedQuestions.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 作成質問 */}
        <Grid item xs={12} md={6}>
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
                            <Box>
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
                            <Typography variant="body2">
                              作成日: {new Date(question.createdAt).toLocaleDateString('ja-JP')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    {index < createdQuestions.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 最近のプロジェクト */}
        <Grid item xs={12}>
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
            <Grid container sx={{ p: 2 }}>
              {recentProjects.map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project.id}>
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
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
} 