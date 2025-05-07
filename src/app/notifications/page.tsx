'use client';

import { Suspense } from 'react';
import { Container, Box, CircularProgress } from '@mui/material';
import NotificationsPage from '../components/notifications/NotificationsPage';

export default function NotificationsRoute() {
  return (
    <Suspense fallback={
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    }>
      <NotificationsPage />
    </Suspense>
  );
} 