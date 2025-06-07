import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '@/app/components/common/ErrorBoundary';

// エラーを発生させるテスト用コンポーネント
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('テストエラー');
  }
  return <div>正常なコンテンツ</div>;
};

// コンソールエラーを一時的に無効化
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常時は子コンポーネントをレンダリングする', () => {
    render(
      <ErrorBoundary>
        <div>正常なコンテンツ</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('正常なコンテンツ')).toBeInTheDocument();
  });

  it('エラー発生時にエラー画面を表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    
    // エラーメッセージテキストが表示されていることを確認
    const errorText = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && 
        content.includes('申し訳ございません。予期しないエラーが発生しました。') &&
        content.includes('問題が続く場合は、システム管理者にお問い合わせください。');
    });
    expect(errorText).toBeInTheDocument();
  });

  it('開発環境でエラー詳細を表示する', () => {
    const originalEnv = process.env.NODE_ENV;
    
    // NODE_ENVを一時的に変更可能にする
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('エラー詳細:')).toBeInTheDocument();
    expect(screen.getByText(/Error: テストエラー/)).toBeInTheDocument();

    // 元の値に戻す
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
      writable: true,
    });
  });

  it('本番環境でエラー詳細を表示しない', () => {
    const originalEnv = process.env.NODE_ENV;
    
    // NODE_ENVを一時的に変更可能にする
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('エラー詳細:')).not.toBeInTheDocument();
    expect(screen.queryByText(/Error: テストエラー/)).not.toBeInTheDocument();

    // 元の値に戻す
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
      writable: true,
    });
  });

  it('カスタムフォールバックを表示する', () => {
    const customFallback = <div>カスタムエラー画面</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('カスタムエラー画面')).toBeInTheDocument();
    expect(screen.queryByText('エラーが発生しました')).not.toBeInTheDocument();
  });

  it('再試行ボタンをクリックすると状態がリセットされる', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
          <button onClick={() => setShouldThrow(false)}>修正</button>
        </ErrorBoundary>
      );
    };

    const { rerender } = render(<TestComponent />);

    // エラー画面が表示される
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();

    // 再試行ボタンをクリック
    const retryButton = screen.getByText('再試行');
    fireEvent.click(retryButton);

    // 再レンダリング
    rerender(<TestComponent />);

    // エラーが再発生
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });

  it('ホームに戻るボタンが正しく動作する', () => {
    // window.location.hrefをモック
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const homeButton = screen.getByText('ホームに戻る');
    fireEvent.click(homeButton);

    expect(window.location.href).toBe('/dashboard');
  });

  it('componentDidCatchでエラーログを出力する', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );

    consoleErrorSpy.mockRestore();
  });
}); 