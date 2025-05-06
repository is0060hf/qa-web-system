'use client';

import React from 'react';
import { 
  TextField, 
  TextFieldProps, 
  Typography, 
  Box, 
  FormHelperText 
} from '@mui/material';

interface FormTextFieldProps extends Omit<TextFieldProps, 'error'> {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  showOptionalLabel?: boolean;
}

export default function FormTextField({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  showOptionalLabel = true,
  ...rest
}: FormTextFieldProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
        <Typography 
          component="label" 
          htmlFor={name}
          variant="subtitle2" 
          sx={{ fontWeight: 500 }}
        >
          {label}
          {required && <Typography component="span" color="error.main"> *</Typography>}
        </Typography>
        {!required && showOptionalLabel && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            （任意）
          </Typography>
        )}
      </Box>
      <TextField
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={!!error}
        placeholder={rest.placeholder || `${label}を入力`}
        fullWidth
        variant="outlined"
        size="medium"
        {...rest}
      />
      {(error || helperText) && (
        <FormHelperText 
          error={!!error}
          sx={{ mx: 1.5, mt: 0.5 }}
        >
          {error || helperText}
        </FormHelperText>
      )}
    </Box>
  );
} 