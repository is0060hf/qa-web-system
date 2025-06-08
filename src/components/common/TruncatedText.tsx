'use client';

import React from 'react';
import { Tooltip, Typography, TypographyProps } from '@mui/material';

interface TruncatedTextProps extends TypographyProps {
  text: string;
  maxWidth?: number | string;
  lines?: number;
  showTooltip?: boolean;
  display?: 'inline-block' | 'block';
}

/**
 * 長いテキストを省略表示するコンポーネント
 * @param text 表示するテキスト
 * @param maxWidth 最大幅（デフォルト: 100%）
 * @param lines 表示する最大行数（デフォルト: 1）
 * @param showTooltip ツールチップを表示するか（デフォルト: true）
 * @param display 表示形式（デフォルト: 'inline-block'）
 */
export default function TruncatedText({
  text,
  maxWidth = '100%',
  lines = 1,
  showTooltip = true,
  display = 'inline-block',
  ...typographyProps
}: TruncatedTextProps) {
  const truncatedStyle = {
    maxWidth,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    ...(lines === 1
      ? { whiteSpace: 'nowrap' as const }
      : {
          display: '-webkit-box',
          WebkitLineClamp: lines,
          WebkitBoxOrient: 'vertical' as const,
          whiteSpace: 'normal' as const,
        }),
  };

  const content = (
    <Typography
      {...typographyProps}
      sx={{
        ...truncatedStyle,
        ...typographyProps.sx,
      }}
    >
      {text}
    </Typography>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <Tooltip title={text} enterDelay={500} leaveDelay={200}>
      <span style={{ 
        display: display,
        maxWidth: '100%',
        minWidth: 0
      }}>
        {content}
      </span>
    </Tooltip>
  );
} 