'use client';

import { Suspense } from 'react';
import { Container, Box, CircularProgress } from '@mui/material';
import NotificationsPage from '../components/notifications/NotificationsPage';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function NotificationsRoute() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      }>
        <NotificationsPage />
      </Suspense>
    </DashboardLayout>
  );
} 