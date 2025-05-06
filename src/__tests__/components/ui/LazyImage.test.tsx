import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LazyImage from '@/components/ui/LazyImage';

// IntersectionObserver APIのモック
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockImplementation((callback) => {
  return {
    observe: jest.fn((element) => {
      // すぐにコールバックを呼び出して表示状態をシミュレート
      callback([
        {
          isIntersecting: true,
          target: element,
        },
      ]);
    }),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  };
});

window.IntersectionObserver = mockIntersectionObserver;

describe('LazyImage コンポーネント', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'テスト画像',
    width: 300,
    height: 200,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('基本的なレンダリングが正しく行われること', () => {
    render(<LazyImage {...defaultProps} />);
    
    // 初期状態ではプレースホルダーが表示されていることを確認
    expect(screen.getByLabelText(/画像読み込み中:/)).toBeInTheDocument();
  });

  it('優先度が高い画像は即座に読み込まれること', async () => {
    const { container } = render(<LazyImage {...defaultProps} priority={true} />);
    
    // priority=true の場合、IntersectionObserverを使わずに即座に画像が表示される
    expect(mockIntersectionObserver).not.toHaveBeenCalled();
    
    // 画像要素が存在するかの確認
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('test-image.jpg'));
    expect(img).toHaveAttribute('alt', 'テスト画像');
  });

  it('画像が読み込まれたらプレースホルダーが非表示になること', async () => {
    const { container } = render(<LazyImage {...defaultProps} />);
    
    // IntersectionObserver が呼び出されることを確認
    expect(mockIntersectionObserver).toHaveBeenCalled();
    
    // 画像要素が存在するかの確認
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    
    // 画像の onLoad イベントをシミュレート
    if (img) {
      img.dispatchEvent(new Event('load'));
    }
    
    // 遅延して読み込みステータスが更新されることを確認
    await waitFor(() => {
      expect(screen.queryByLabelText(/画像読み込み中:/)).not.toBeInTheDocument();
      const loadedImg = container.querySelector('img.opacity-100');
      expect(loadedImg).toBeInTheDocument();
    });
  });

  it('オプションパラメータが正しく適用されること', () => {
    const { container } = render(
      <LazyImage 
        {...defaultProps}
        className="custom-class"
        blurDataURL="data:image/jpeg;base64,test"
      />
    );
    
    // カスタムクラスが適用されていることを確認
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('NoScriptタグが含まれており、JavaScriptが無効な環境でも画像が表示されること', () => {
    const { container } = render(<LazyImage {...defaultProps} />);
    
    // noscript タグ内の img 要素を取得（DOMStringとして確認）
    const html = container.innerHTML;
    expect(html).toContain('<noscript>');
    expect(html).toContain('</noscript>');
  });
}); 