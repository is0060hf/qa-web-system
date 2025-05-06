'use client';

import { useCallback, useRef, KeyboardEvent } from 'react';
import { useAccessibility } from '../components/providers/AccessibilityProvider';

interface PaginationKeyboardOptions {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Custom hook for accessibility features
 */
export function useA11y() {
  const { announceToScreenReader, highContrastMode, toggleHighContrastMode, fontSize, setFontSize } = useAccessibility();
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Announce to screen readers with debounce
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
    
    announcementTimeoutRef.current = setTimeout(() => {
      announceToScreenReader(message);
    }, 100);
  }, [announceToScreenReader]);

  // Handle keyboard navigation for pagination
  const handlePaginationKeyboard = useCallback(
    ({ currentPage, totalPages, onPageChange }: PaginationKeyboardOptions) => 
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (currentPage < totalPages) {
          e.preventDefault();
          onPageChange(currentPage + 1);
          announce(`${currentPage + 1}ページに移動しました。${totalPages}ページ中${currentPage + 1}ページ目です。`);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentPage > 1) {
          e.preventDefault();
          onPageChange(currentPage - 1);
          announce(`${currentPage - 1}ページに移動しました。${totalPages}ページ中${currentPage - 1}ページ目です。`);
        }
      } else if (e.key === 'Home') {
        if (currentPage !== 1) {
          e.preventDefault();
          onPageChange(1);
          announce(`最初のページに移動しました。${totalPages}ページ中1ページ目です。`);
        }
      } else if (e.key === 'End') {
        if (currentPage !== totalPages) {
          e.preventDefault();
          onPageChange(totalPages);
          announce(`最後のページに移動しました。${totalPages}ページ中${totalPages}ページ目です。`);
        }
      }
    },
    [announce]
  );

  // Make an element focusable and announce its content
  const makeFocusable = useCallback(
    (ref: React.RefObject<HTMLElement>, message?: string) => {
      if (ref.current) {
        if (!ref.current.hasAttribute('tabindex')) {
          ref.current.setAttribute('tabindex', '0');
        }
        
        if (message) {
          ref.current.addEventListener('focus', () => {
            announce(message);
          }, { once: true });
        }
      }
    },
    [announce]
  );

  // Announce when data is loading
  const announceLoading = useCallback(() => {
    announce('データを読み込み中です。お待ちください。');
  }, [announce]);

  // Announce when data is loaded
  const announceLoaded = useCallback((itemCount?: number) => {
    if (itemCount !== undefined) {
      announce(`データの読み込みが完了しました。${itemCount}件のアイテムがあります。`);
    } else {
      announce('データの読み込みが完了しました。');
    }
  }, [announce]);

  // Announce form errors
  const announceFormErrors = useCallback((errors: string[]) => {
    if (errors.length === 0) return;
    
    const errorMessage = errors.length === 1
      ? `フォームに1つのエラーがあります: ${errors[0]}`
      : `フォームに${errors.length}個のエラーがあります: ${errors.join('、')}`;
    
    announce(errorMessage, 'assertive');
  }, [announce]);

  return {
    announce,
    handlePaginationKeyboard,
    makeFocusable,
    announceLoading,
    announceLoaded,
    announceFormErrors,
    highContrastMode,
    toggleHighContrastMode,
    fontSize,
    setFontSize
  };
} 