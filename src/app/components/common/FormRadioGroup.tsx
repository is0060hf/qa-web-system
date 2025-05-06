'use client';

import React from 'react';
import { 
  Box, 
  FormControl, 
  FormControlLabel, 
  FormHelperText, 
  Radio, 
  RadioGroup, 
  Typography 
} from '@mui/material';

export interface RadioOption {
  value: string;
  label: string;
}

interface FormRadioGroupProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: RadioOption[];
  error?: string;
  helperText?: string;
  required?: boolean;
  showOptionalLabel?: boolean;
  row?: boolean;
  disabled?: boolean;
}

export default function FormRadioGroup({
  name,
  label,
  value,
  onChange,
  options,
  error,
  helperText,
  required = false,
  showOptionalLabel = true,
  row = false,
  disabled = false
}: FormRadioGroupProps) {
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
      <FormControl error={!!error} fullWidth>
        <RadioGroup
          row={row}
          name={name}
          value={value}
          onChange={onChange}
        >
          {options.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio disabled={disabled} />}
              label={option.label}
              disabled={disabled}
            />
          ))}
        </RadioGroup>
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