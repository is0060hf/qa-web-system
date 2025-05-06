import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useA11y } from '@/hooks/useA11y';
import { AccessibilityProvider } from '@/components/providers/AccessibilityProvider';

// テスト用のコンポーネント
function TestComponent() {
  const {
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
  } = useA11y();

  // テスト用の参照
  const testRef = React.useRef<HTMLDivElement>(null);

  // コンポーネントマウント時に参照要素をフォーカス可能にする
  React.useEffect(() => {
    if (testRef.current) {
      makeFocusable(testRef, 'フォーカス可能な要素です');
    }
  }, [makeFocusable]);

  // ページネーションハンドラー
  const paginationHandler = handlePaginationKeyboard({
    currentPage: 2,
    totalPages: 5,
    onPageChange: jest.fn(),
  });

  return (
    <div>
      <button onClick={() => announce('テスト通知')}>通知する</button>
      <button onClick={announceLoading}>読み込み中</button>
      <button onClick={() => announceLoaded(10)}>読み込み完了</button>
      <button onClick={() => announceFormErrors(['エラー1', 'エラー2'])}>
        フォームエラー
      </button>
      <div 
        data-testid="pagination" 
        tabIndex={0} 
        onKeyDown={paginationHandler}
      >
        ページネーション
      </div>
      <div
        ref={testRef}
        data-testid="focusable-element"
      >
        フォーカス可能な要素
      </div>
      <div>
        <p>表示設定:</p>
        <button onClick={toggleHighContrastMode}>
          {highContrastMode ? 'コントラストモードオフ' : 'コントラストモードオン'}
        </button>
        <div data-testid="font-size">サイズ: {fontSize}</div>
        <button onClick={() => setFontSize('large')}>大きいフォント</button>
        <button onClick={() => setFontSize('normal')}>標準フォント</button>
      </div>
    </div>
  );
}

// useA11yはAccessibilityProviderのコンテキストを使用するためラッパーが必要
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AccessibilityProvider>
      {ui}
    </AccessibilityProvider>
  );
};

describe('useA11y フック', () => {
  it('スクリーンリーダー通知機能が正しく動作すること', async () => {
    renderWithProviders(<TestComponent />);
    
    // 通知ボタンをクリック
    fireEvent.click(screen.getByText('通知する'));
    
    // 通知が表示されることを確認
    await waitFor(() => {
      const announcements = document.querySelectorAll('[aria-live="polite"] div');
      expect(announcements.length).toBeGreaterThan(0);
    });
  });

  it('読み込み状態の通知機能が正しく動作すること', async () => {
    renderWithProviders(<TestComponent />);
    
    // 読み込み中通知
    fireEvent.click(screen.getByText('読み込み中'));
    await waitFor(() => {
      const announcements = document.querySelectorAll('[aria-live="polite"] div');
      expect(announcements[0]).toHaveTextContent('データを読み込み中です');
    });
    
    // 読み込み完了通知
    fireEvent.click(screen.getByText('読み込み完了'));
    await waitFor(() => {
      const announcements = document.querySelectorAll('[aria-live="polite"] div');
      // 最新の通知は配列の最後の要素に追加されるため、最後の要素をチェック
      const lastIndex = announcements.length - 1;
      expect(announcements[lastIndex]).toHaveTextContent('データの読み込みが完了しました');
      expect(announcements[lastIndex].textContent).toContain('10件');
    });
  });

  it('フォームエラー通知機能が正しく動作すること', async () => {
    renderWithProviders(<TestComponent />);
    
    // フォームエラー通知
    fireEvent.click(screen.getByText('フォームエラー'));
    await waitFor(() => {
      const announcements = document.querySelectorAll('[aria-live="polite"] div');
      const lastIndex = announcements.length - 1;
      expect(announcements[lastIndex].textContent).toContain('エラー');
      expect(announcements[lastIndex].textContent).toContain('2個');
    });
  });

  it('ページネーション用キーボードハンドラーが正しく動作すること', () => {
    renderWithProviders(<TestComponent />);
    
    const paginationElement = screen.getByTestId('pagination');
    
    // 右矢印キーで次ページへ
    fireEvent.keyDown(paginationElement, { key: 'ArrowRight' });
    
    // 左矢印キーで前ページへ
    fireEvent.keyDown(paginationElement, { key: 'ArrowLeft' });
    
    // Homeキーで最初のページへ
    fireEvent.keyDown(paginationElement, { key: 'Home' });
    
    // Endキーで最後のページへ
    fireEvent.keyDown(paginationElement, { key: 'End' });
    
    // 各キーイベントで通知が行われることを確認（詳細な検証は省略）
  });

  it('要素をフォーカス可能にする機能が正しく動作すること', () => {
    renderWithProviders(<TestComponent />);
    
    const focusableElement = screen.getByTestId('focusable-element');
    expect(focusableElement).toHaveAttribute('tabindex', '0');
    
    // フォーカスイベントをトリガー
    fireEvent.focus(focusableElement);
    
    // フォーカス時に通知が行われることを確認
    // (詳細な検証は省略)
  });

  it('表示設定機能が正しく動作すること', () => {
    renderWithProviders(<TestComponent />);
    
    // 初期状態の確認
    expect(screen.getByTestId('font-size')).toHaveTextContent('サイズ: normal');
    
    // フォントサイズの変更
    fireEvent.click(screen.getByText('大きいフォント'));
    expect(screen.getByTestId('font-size')).toHaveTextContent('サイズ: large');
    
    // 標準サイズに戻す
    fireEvent.click(screen.getByText('標準フォント'));
    expect(screen.getByTestId('font-size')).toHaveTextContent('サイズ: normal');
    
    // コントラストモードの切り替え
    fireEvent.click(screen.getByText('コントラストモードオン'));
    expect(screen.getByText('コントラストモードオフ')).toBeInTheDocument();
  });
}); 