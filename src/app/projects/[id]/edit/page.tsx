'use client';

import { useState, useEffect } from 'react';
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

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [updateError, setUpdateError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await fetchData<Project>(`projects/${params.id}`, {});
        setProject(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

  const handleUpdateProject = async (name: string, description: string) => {
    setIsSubmitting(true);
    setUpdateError(undefined);

    try {
      await fetchData<Project>(`projects/${params.id}`, {
        method: 'PATCH',
        body: { name, description },
      });

      router.push(`/projects/${params.id}`);
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