'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Typography, Container, CircularProgress } from '@mui/material';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import ProjectForm from '@/app/components/projects/ProjectForm';
import { fetchData } from '@/lib/utils/fetchData';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // React.use() を使用して params をアンラップ
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [updateError, setUpdateError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      try {
        setIsLoading(true);
        const data = await fetchData<Project>(`projects/${projectId}`, {});
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [projectId]);

  const handleUpdateProject = async (name: string, description: string) => {
    setIsSubmitting(true);
    setUpdateError(undefined);

    try {
      await fetchData<Project>(`projects/${projectId}`, {
        method: 'PATCH',
        body: { name, description },
      });

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : '予期せぬエラーが発生しました');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            プロジェクト編集
          </Typography>
        </Box>

        {project && (
          <ProjectForm
            onSubmit={handleUpdateProject}
            initialData={project}
            isLoading={isSubmitting}
            error={updateError}
            isEditMode={true}
          />
        )}
      </Container>
    </DashboardLayout>
  );
} 