'use client';

import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectProps, 
  Typography, 
  Box, 
  FormHelperText 
} from '@mui/material';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectFieldProps extends Omit<SelectProps, 'error' | 'onChange'> {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<{ name?: string; value: unknown }>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  required?: boolean;
  showOptionalLabel?: boolean;
}

export default function FormSelectField({
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  error,
  helperText,
  required = false,
  showOptionalLabel = true,
  ...rest
}: FormSelectFieldProps) {
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
      <FormControl fullWidth error={!!error}>
        <Select
          id={name}
          name={name}
          value={value}
          onChange={onChange as any}
          onBlur={onBlur as any}
          displayEmpty
          {...rest}
        >
          <MenuItem value="" disabled>
            {`${label}を選択`}
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {(error || helperText) && (
          <FormHelperText 
            error={!!error}
            sx={{ mx: 1.5, mt: 0.5 }}
          >
            {error || helperText}
          </FormHelperText>
        )}
      </FormControl>
    </Box>
  );
} 