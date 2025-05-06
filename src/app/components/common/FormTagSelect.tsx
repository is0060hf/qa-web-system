'use client';

import React from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  FormHelperText,
  Autocomplete,
  Chip
} from '@mui/material';

export interface TagOption {
  id: string;
  name: string;
}

interface FormTagSelectProps {
  name: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: TagOption[];
  error?: string;
  helperText?: string;
  required?: boolean;
  showOptionalLabel?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function FormTagSelect({
  name,
  label,
  value = [],
  onChange,
  options = [],
  error,
  helperText,
  required = false,
  showOptionalLabel = true,
  disabled = false,
  placeholder = 'タグを選択'
}: FormTagSelectProps) {
  // オプションマップ (id → TagOption)
  const optionsMap = options.reduce((map, option) => {
    map[option.id] = option;
    return map;
  }, {} as Record<string, TagOption>);

  // 選択されたタグIDからTagOptionを取得
  const selectedOptions = value.map(id => optionsMap[id]).filter(Boolean);

  // 選択変更ハンドラ
  const handleChange = (_event: React.SyntheticEvent, newValue: TagOption[]) => {
    const newIds = newValue.map(option => option.id);
    onChange(newIds);
  };

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
      
      <Autocomplete
        multiple
        id={name}
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              label={option.name}
              size="small"
              {...getTagProps({ index })}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            name={name}
            placeholder={value.length > 0 ? undefined : placeholder}
            error={!!error}
            fullWidth
            variant="outlined"
            size="medium"
          />
        )}
        disabled={disabled}
        noOptionsText="該当するタグがありません"
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