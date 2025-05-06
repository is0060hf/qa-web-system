import { useRef, useEffect, useCallback } from 'react';

// アクセシビリティに関するユーティリティフック

/**
 * スクリーンリーダーにメッセージを通知するためのフック
 * @returns announce メッセージを読み上げる関数
 */
export function useAnnounce() {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // LiveRegion要素をDOMに追加
    if (!document.getElementById('a11y-announcer')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'a11y-announcer';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.setAttribute('role', 'status');
      liveRegion.className = 'sr-only'; // screenreader-onlyスタイル
      liveRegion.style.position = 'absolute';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.padding = '0';
      liveRegion.style.margin = '-1px';
      liveRegion.style.overflow = 'hidden';
      liveRegion.style.clip = 'rect(0, 0, 0, 0)';
      liveRegion.style.whiteSpace = 'nowrap';
      liveRegion.style.border = '0';
      document.body.appendChild(liveRegion);
      announceRef.current = liveRegion;
    } else {
      announceRef.current = document.getElementById('a11y-announcer') as HTMLDivElement;
    }

    return () => {
      // コンポーネントのアンマウント時にはLiveRegionを削除しない
      // 他のコンポーネントでも利用する可能性があるため
    };
  }, []);

  /**
   * スクリーンリーダーに通知するメッセージをセット
   * @param message 読み上げるメッセージ
   * @param politeness 優先度 'polite'(デフォルト) または 'assertive'
   */
  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      // LiveRegionの属性を更新
      announceRef.current.setAttribute('aria-live', politeness);
      
      // メッセージを設定（スクリーンリーダーに通知）
      announceRef.current.textContent = '';
      // 少し遅延させることで確実に変更を検知させる
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = message;
        }
      }, 50);
    }
  }, []);

  return { announce };
}

/**
 * アクセシビリティに配慮したペジネーション支援フック
 * @param currentPage 現在のページ番号
 * @param totalPages 総ページ数
 * @returns ページ変更時の通知を行う関数
 */
export function usePaginationA11y(currentPage: number, totalPages: number) {
  const { announce } = useAnnounce();
  
  // ページ変更のアナウンス
  useEffect(() => {
    announce(`ページ ${currentPage} / ${totalPages} を表示中`);
  }, [currentPage, totalPages, announce]);
  
  return { announce };
}

/**
 * アクセシビリティに配慮したフォーム操作支援フック
 * @returns フォーム操作に関連する支援関数
 */
export function useFormA11y() {
  const { announce } = useAnnounce();
  
  /**
   * フォーム送信後のアナウンス
   * @param success 成功したかどうか
   * @param message カスタムメッセージ（指定しない場合はデフォルトメッセージ）
   */
  const announceSubmitResult = useCallback((
    success: boolean, 
    message?: string
  ) => {
    const defaultMessage = success 
      ? 'フォームを送信しました' 
      : 'フォームの送信に失敗しました';
    
    announce(message || defaultMessage, success ? 'polite' : 'assertive');
  }, [announce]);
  
  /**
   * フォームのバリデーションエラーをアナウンス
   * @param errors エラーメッセージのオブジェクトまたは配列
   */
  const announceValidationErrors = useCallback((
    errors: Record<string, string> | string[]
  ) => {
    let errorMessage = '入力内容に問題があります：';
    
    if (Array.isArray(errors)) {
      errorMessage += errors.join('、');
    } else {
      errorMessage += Object.values(errors).join('、');
    }
    
    announce(errorMessage, 'assertive');
  }, [announce]);
  
  return {
    announceSubmitResult,
    announceValidationErrors,
    announce
  };
}

/**
 * 要素IDを生成するユーティリティフック
 * @param baseId 基本ID
 * @returns 一意のIDを生成する関数
 */
export function useId(baseId?: string) {
  const idRef = useRef<string>(
    baseId || `a11y-${Math.random().toString(36).substring(2, 9)}`
  );
  
  const getId = useCallback((suffix?: string) => {
    return suffix ? `${idRef.current}-${suffix}` : idRef.current;
  }, []);
  
  return { getId };
} 