'use client';

import React from 'react';
import { 
  Box, 
  Checkbox, 
  CheckboxProps, 
  FormControlLabel, 
  FormHelperText, 
  Typography 
} from '@mui/material';

interface FormCheckboxProps extends Omit<CheckboxProps, 'error'> {
  name: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
}

export default function FormCheckbox({
  name,
  label,
  checked,
  onChange,
  error,
  helperText,
  ...rest
}: FormCheckboxProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <FormControlLabel
        control={
          <Checkbox
            id={name}
            name={name}
            checked={checked}
            onChange={onChange}
            {...rest}
          />
        }
        label={
          <Typography variant="body2">
            {label}
          </Typography>
        }
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