'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import SearchForm, { SearchParams } from '../components/search/SearchForm';
import SearchResults, { Question } from '../components/search/SearchResults';
import { useRouter, useSearchParams } from 'next/navigation';
import { SelectOption } from '../components/common/FormSelectField';
import { fetchData } from '@/lib/utils/fetchData';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 状態
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // プロジェクトとユーザーのリスト（フィルター用）
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [assignees, setAssignees] = useState<SelectOption[]>([]);
  const [tags, setTags] = useState<SelectOption[]>([]);

  // URLからの初期検索パラメータ
  const [initialParams, setInitialParams] = useState<SearchParams>({
    keyword: searchParams.get('keyword') || '',
    projectId: searchParams.get('projectId') || '',
    assigneeId: searchParams.get('assigneeId') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    tagId: searchParams.get('tagId') || '',
    isDeadlineExpired: searchParams.get('isDeadlineExpired') === 'true'
  });

  // プロジェクト、ユーザー、タグのリストを取得
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // プロジェクトリストを取得
        const projectsData = await fetchData<any>('projects');
        setProjects(
          projectsData.projects.map((project: any) => ({
            value: project.id,
            label: project.name
          }))
        );

        // ユーザーリストを取得
        const usersData = await fetchData<any>('users', {
          params: { limit: '100' }
        });
        setAssignees(
          usersData.users.map((user: any) => ({
            value: user.id,
            label: user.name || user.email
          }))
        );

        // タグリストを取得（プロジェクトに依存するため、プロジェクトが選択されている場合のみ）
        if (initialParams.projectId) {
          const tagsData = await fetchData<any>(`projects/${initialParams.projectId}/tags`);
          setTags(
            tagsData.map((tag: any) => ({
              value: tag.id,
              label: tag.name
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };

    fetchFilterOptions();
  }, [initialParams.projectId]);

  // 検索実行時のハンドラ
  const handleSearch = (params: SearchParams) => {
    setCurrentPage(1); // 検索条件変更時は1ページ目に戻す
    
    // URLパラメータを更新
    const urlParams = new URLSearchParams();
    if (params.keyword) urlParams.set('keyword', params.keyword);
    if (params.projectId) urlParams.set('projectId', params.projectId);
    if (params.assigneeId) urlParams.set('assigneeId', params.assigneeId);
    if (params.status) urlParams.set('status', params.status);
    if (params.priority) urlParams.set('priority', params.priority);
    if (params.tagId) urlParams.set('tagId', params.tagId);
    if (params.isDeadlineExpired) urlParams.set('isDeadlineExpired', 'true');
    
    router.push(`/search?${urlParams.toString()}`);
    
    fetchQuestions(params, 1);
  };

  // ページ変更時のハンドラ
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchQuestions(initialParams, page);
  };

  // 質問詳細に遷移
  const handleQuestionClick = (question: Question) => {
    router.push(`/questions/${question.id}`);
  };

  // 質問を検索
  const fetchQuestions = async (params: SearchParams, page = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // API用のパラメータを準備
      const queryParams: Record<string, string> = {};
      if (params.keyword) queryParams.search = params.keyword;
      if (params.projectId) queryParams.projectId = params.projectId;
      if (params.assigneeId) queryParams.assigneeId = params.assigneeId;
      if (params.status) queryParams.status = params.status;
      if (params.priority) queryParams.priority = params.priority;
      if (params.tagId) queryParams.tagId = params.tagId;
      if (params.isDeadlineExpired) queryParams.isDeadlineExpired = 'true';
      
      queryParams.page = page.toString();
      queryParams.limit = pageSize.toString();
      
      const data = await fetchData<any>('questions', {
        params: queryParams
      });
      
      setQuestions(data.questions);
      setTotal(data.total);
      setInitialParams(params); // 初期パラメータを更新
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError(err instanceof Error ? err.message : '検索に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 初期表示時に検索を実行
  useEffect(() => {
    if (Object.values(initialParams).some(value => value)) {
      fetchQuestions(initialParams);
    }
  }, []);

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          質問検索
        </Typography>
        
        <SearchForm
          onSearch={handleSearch}
          projects={projects}
          assignees={assignees}
          tags={tags}
          initialParams={initialParams}
          isLoading={isLoading}
        />
        
        {(questions.length > 0 || isLoading || error) && (
          <Box sx={{ mt: 4 }}>
            <SearchResults
              questions={questions}
              total={total}
              currentPage={currentPage}
              pageSize={pageSize}
              isLoading={isLoading}
              error={error || undefined}
              onPageChange={handlePageChange}
              onQuestionClick={handleQuestionClick}
            />
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
} 