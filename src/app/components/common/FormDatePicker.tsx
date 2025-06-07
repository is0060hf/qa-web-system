'use client';

import React from 'react';
import { 
  Box, 
  FormHelperText, 
  TextField, 
  TextFieldProps, 
  Typography 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale/ja';

// 注: @mui/x-date-pickersとdate-fnsがインストールされていない場合は、以下を実行してください:
// npm install @mui/x-date-pickers date-fns

interface FormDatePickerProps extends Omit<TextFieldProps, 'error' | 'onChange' | 'value'> {
  name: string;
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  showOptionalLabel?: boolean;
  disablePast?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export default function FormDatePicker({
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  showOptionalLabel = true,
  disablePast = false,
  minDate,
  maxDate,
  ...rest
}: FormDatePickerProps) {
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
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
        <DatePicker
          value={value}
          onChange={onChange}
          disablePast={disablePast}
          minDate={minDate}
          maxDate={maxDate}
          slotProps={{
            textField: {
              id: name,
              name,
              fullWidth: true,
              variant: 'outlined',
              size: 'medium',
              error: !!error,
              ...rest
            },
          }}
        />
      </LocalizationProvider>
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