'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Box } from '@mui/material';
import '@uiw/react-markdown-preview/markdown.css';

// Markdownプレビューをクライアントサイドでのみ読み込む
const MDPreview = dynamic(() => import('@uiw/react-markdown-preview'), { 
  ssr: false 
});

interface MarkdownViewerProps {
  content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  return (
    <Box
      sx={{
        '& .wmde-markdown': {
          backgroundColor: 'transparent',
          color: 'text.primary',
          fontFamily: 'inherit',
          '& pre': {
            backgroundColor: 'action.hover',
            borderRadius: 1,
            p: 2,
          },
          '& code': {
            backgroundColor: 'action.selected',
            borderRadius: 0.5,
            px: 0.5,
            py: 0.25,
            fontSize: '0.875em',
          },
          '& blockquote': {
            borderLeft: '4px solid',
            borderLeftColor: 'primary.main',
            pl: 2,
            ml: 0,
            color: 'text.secondary',
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            mb: 2,
          },
          '& th, & td': {
            border: '1px solid',
            borderColor: 'divider',
            p: 1.5,
            textAlign: 'left',
          },
          '& th': {
            backgroundColor: 'action.hover',
            fontWeight: 600,
          },
        },
      }}
    >
      <MDPreview 
        source={content} 
        style={{ backgroundColor: 'transparent' }}
        disallowedElements={['script', 'iframe']}
      />
    </Box>
  );
};

export default MarkdownViewer; 