import React from 'react';
import {
  Snackbar,
  Alert,
  AlertColor,
  Slide,
  SlideProps,
} from '@mui/material';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export default function Toast({ toast, onClose }: ToastProps) {
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose(toast.id);
  };

  return (
    <Snackbar
      open={true}
      autoHideDuration={toast.duration || 5000}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <Alert
        onClose={handleClose}
        severity={toast.type as AlertColor}
        variant="filled"
        sx={{
          width: '100%',
          minWidth: 300,
          maxWidth: 500,
        }}
      >
        {toast.message}
      </Alert>
    </Snackbar>
  );
} 