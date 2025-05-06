import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccessibilityProvider, useAccessibility } from '@/components/providers/AccessibilityProvider';

// テスト用のコンシューマーコンポーネント
function TestConsumer() {
  const { 
    announceToScreenReader, 
    highContrastMode, 
    toggleHighContrastMode,
    fontSize, 
    setFontSize 
  } = useAccessibility();

  return (
    <div>
      <button onClick={() => announceToScreenReader('テスト通知')}>通知する</button>
      <button onClick={toggleHighContrastMode}>
        コントラストモード: {highContrastMode ? 'オン' : 'オフ'}
      </button>
      <div data-testid="font-size">{fontSize}</div>
      <button onClick={() => setFontSize('large')}>大きいフォント</button>
      <button onClick={() => setFontSize('larger')}>より大きいフォント</button>
      <button onClick={() => setFontSize('normal')}>標準フォント</button>
    </div>
  );
}

describe('AccessibilityProvider コンポーネント', () => {
  beforeEach(() => {
    // DOMに追加されたスタイル要素をクリア
    document.head.innerHTML = '';
    document.body.classList.remove('keyboard-user', 'font-size-large', 'font-size-larger');
    document.documentElement.classList.remove('high-contrast-mode');
  });

  it('スキップリンクが正しくレンダリングされること', () => {
    render(
      <AccessibilityProvider>
        <div>テストコンテンツ</div>
      </AccessibilityProvider>
    );
    
    const skipLink = screen.getByText('コンテンツにスキップ');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink).toHaveClass('skip-to-content');
  });

  it('子コンポーネントが正しくレンダリングされること', () => {
    render(
      <AccessibilityProvider>
        <div data-testid="child">子コンテンツ</div>
      </AccessibilityProvider>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('子コンテンツ')).toBeInTheDocument();
  });

  it('キーボードフォーカススタイルが適用されること', () => {
    render(
      <AccessibilityProvider>
        <div>テストコンテンツ</div>
      </AccessibilityProvider>
    );
    
    // Tabキーイベントをシミュレート
    fireEvent.keyDown(document, { key: 'Tab' });
    
    expect(document.body.classList.contains('keyboard-user')).toBe(true);
    
    // マウスクリックをシミュレート
    fireEvent.mouseDown(document);
    
    expect(document.body.classList.contains('keyboard-user')).toBe(false);
  });

  it('useAccessibility フックが正しく動作すること', () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );
    
    // 初期状態の確認
    expect(screen.getByText('コントラストモード: オフ')).toBeInTheDocument();
    expect(screen.getByTestId('font-size')).toHaveTextContent('normal');
    
    // 高コントラストモードの切り替え
    fireEvent.click(screen.getByText('コントラストモード: オフ'));
    expect(screen.getByText('コントラストモード: オン')).toBeInTheDocument();
    expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(true);
    
    // フォントサイズの変更
    fireEvent.click(screen.getByText('大きいフォント'));
    expect(screen.getByTestId('font-size')).toHaveTextContent('large');
    expect(document.body.classList.contains('font-size-large')).toBe(true);
    
    fireEvent.click(screen.getByText('より大きいフォント'));
    expect(screen.getByTestId('font-size')).toHaveTextContent('larger');
    expect(document.body.classList.contains('font-size-larger')).toBe(true);
    expect(document.body.classList.contains('font-size-large')).toBe(false);
    
    fireEvent.click(screen.getByText('標準フォント'));
    expect(screen.getByTestId('font-size')).toHaveTextContent('normal');
    expect(document.body.classList.contains('font-size-larger')).toBe(false);
  });

  it('スクリーンリーダー通知が機能すること', async () => {
    // レンダリング
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );
    
    // 通知ボタンをクリック
    fireEvent.click(screen.getByText('通知する'));
    
    // 通知要素を確認
    await waitFor(() => {
      const announcements = document.querySelectorAll('[aria-live="polite"] div');
      expect(announcements.length).toBeGreaterThan(0);
      expect(announcements[0]).toHaveTextContent('テスト通知');
    });
    
    // タイムアウト後に通知が消えることをテスト（テストを単純化するため省略）
  });
}); 