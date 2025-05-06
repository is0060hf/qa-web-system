'use client';

import React from 'react';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import BlockIcon from '@mui/icons-material/Block';

export default function ForbiddenPage() {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  const goHome = () => {
    router.push('/');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <BlockIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        
        <Typography variant="h3" component="h1" gutterBottom>
          アクセス権限がありません
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          このページにアクセスするための権限がありません。
          <br />
          必要な権限を持っている場合は、システム管理者にお問い合わせください。
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="outlined" onClick={goBack}>
            前のページに戻る
          </Button>
          
          <Button variant="contained" onClick={goHome}>
            ホームに戻る
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 