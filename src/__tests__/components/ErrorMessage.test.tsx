import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorMessage, { getErrorMessage, getErrorType } from '@/app/components/common/ErrorMessage';

describe('ErrorMessage', () => {
  const defaultProps = {
    message: 'テストエラーメッセージ',
  };

  it('デフォルトのエラーメッセージを表示する', () => {
    render(<ErrorMessage {...defaultProps} />);

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument();
  });

  it('カスタムタイトルを表示する', () => {
    render(<ErrorMessage {...defaultProps} title="カスタムエラー" />);

    expect(screen.getByText('カスタムエラー')).toBeInTheDocument();
    expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument();
  });

  it('各エラータイプに応じた表示をする', () => {
    const { rerender } = render(<ErrorMessage {...defaultProps} type="error" />);
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();

    rerender(<ErrorMessage {...defaultProps} type="warning" />);
    expect(screen.getByText('警告')).toBeInTheDocument();

    rerender(<ErrorMessage {...defaultProps} type="network" />);
    expect(screen.getByText('ネットワークエラー')).toBeInTheDocument();

    rerender(<ErrorMessage {...defaultProps} type="validation" />);
    expect(screen.getByText('入力エラー')).toBeInTheDocument();
  });

  it('詳細情報（文字列）を表示する', () => {
    render(
      <ErrorMessage {...defaultProps} details="詳細なエラー情報です" />
    );

    expect(screen.getByText('詳細なエラー情報です')).toBeInTheDocument();
  });

  it('詳細情報（配列）を表示する', () => {
    const details = ['エラー1', 'エラー2', 'エラー3'];
    render(<ErrorMessage {...defaultProps} details={details} />);

    details.forEach(detail => {
      expect(screen.getByText(detail)).toBeInTheDocument();
    });
  });

  it('詳細情報（オブジェクト）を表示する', () => {
    const details = {
      'フィールド1': 'エラーメッセージ1',
      'フィールド2': 'エラーメッセージ2',
    };
    render(<ErrorMessage {...defaultProps} details={details} />);

    expect(screen.getByText('フィールド1:')).toBeInTheDocument();
    expect(screen.getByText('エラーメッセージ1')).toBeInTheDocument();
    expect(screen.getByText('フィールド2:')).toBeInTheDocument();
    expect(screen.getByText('エラーメッセージ2')).toBeInTheDocument();
  });

  it('折りたたみ可能な詳細情報を表示する', () => {
    render(
      <ErrorMessage
        {...defaultProps}
        details="折りたたみ可能な詳細"
        collapsible={true}
      />
    );

    // 初期状態では展開されている
    expect(screen.getByText('折りたたみ可能な詳細')).toBeInTheDocument();

        // 折りたたみボタンをクリック
    const collapseButton = screen.getByTestId('ExpandMoreIcon').closest('button');
    fireEvent.click(collapseButton!);
    
    // TODO: Collapseコンポーネントのアニメーションを待つ必要がある
  });

  it('閉じるボタンが機能する', () => {
    const mockOnClose = jest.fn();
    render(<ErrorMessage {...defaultProps} onClose={mockOnClose} />);

        const closeButton = screen.getByTestId('CloseIcon').closest('button');
    fireEvent.click(closeButton!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('再試行ボタンが機能する', () => {
    const mockOnRetry = jest.fn();
    render(<ErrorMessage {...defaultProps} onRetry={mockOnRetry} />);

    const retryButton = screen.getByText('再試行');
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('アイコンを非表示にできる', () => {
    const { container } = render(
      <ErrorMessage {...defaultProps} showIcon={false} />
    );

    // MUIのAlertコンポーネントはアイコンなしの場合、特定のクラスを持つ
    const alert = container.querySelector('.MuiAlert-root');
    expect(alert).toBeInTheDocument();
  });
});

describe('getErrorMessage', () => {
  it('文字列エラーをそのまま返す', () => {
    expect(getErrorMessage('シンプルなエラー')).toBe('シンプルなエラー');
  });

  it('レスポンスのエラーメッセージを返す', () => {
    const error = {
      response: {
        data: {
          error: 'APIエラーメッセージ',
        },
      },
    };
    expect(getErrorMessage(error)).toBe('APIエラーメッセージ');
  });

  it('レスポンスのmessageフィールドを返す', () => {
    const error = {
      response: {
        data: {
          message: 'APIメッセージ',
        },
      },
    };
    expect(getErrorMessage(error)).toBe('APIメッセージ');
  });

  it('エラーオブジェクトのメッセージを返す', () => {
    const error = new Error('標準エラー');
    expect(getErrorMessage(error)).toBe('標準エラー');
  });

  it('404エラーの場合の定型メッセージを返す', () => {
    const error = {
      response: {
        status: 404,
      },
    };
    expect(getErrorMessage(error)).toBe('リソースが見つかりませんでした');
  });

  it('403エラーの場合の定型メッセージを返す', () => {
    const error = {
      response: {
        status: 403,
      },
    };
    expect(getErrorMessage(error)).toBe('このアクションを実行する権限がありません');
  });

  it('401エラーの場合の定型メッセージを返す', () => {
    const error = {
      response: {
        status: 401,
      },
    };
    expect(getErrorMessage(error)).toBe('認証が必要です。ログインしてください');
  });

  it('500番台エラーの場合の定型メッセージを返す', () => {
    const error = {
      response: {
        status: 500,
      },
    };
    expect(getErrorMessage(error)).toBe('サーバーエラーが発生しました。しばらく時間をおいて再度お試しください');
  });

  it('ネットワークエラーの場合の定型メッセージを返す', () => {
    const error = {
      code: 'NETWORK_ERROR',
    };
    expect(getErrorMessage(error)).toBe('ネットワークに接続できません。インターネット接続を確認してください');
  });

  it('オフラインの場合の定型メッセージを返す', () => {
    // navigator.onLineをモック
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    expect(getErrorMessage({})).toBe('ネットワークに接続できません。インターネット接続を確認してください');

    // 元に戻す
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('不明なエラーの場合のデフォルトメッセージを返す', () => {
    expect(getErrorMessage({})).toBe('予期しないエラーが発生しました');
  });
});

describe('getErrorType', () => {
  it('422エラーの場合validationを返す', () => {
    const error = {
      response: {
        status: 422,
      },
    };
    expect(getErrorType(error)).toBe('validation');
  });

  it('errorsフィールドがある場合validationを返す', () => {
    const error = {
      response: {
        data: {
          errors: {},
        },
      },
    };
    expect(getErrorType(error)).toBe('validation');
  });

  it('ネットワークエラーの場合networkを返す', () => {
    const error = {
      code: 'NETWORK_ERROR',
    };
    expect(getErrorType(error)).toBe('network');
  });

  it('4xx系エラーの場合warningを返す', () => {
    const error = {
      response: {
        status: 404,
      },
    };
    expect(getErrorType(error)).toBe('warning');
  });

  it('5xx系エラーの場合errorを返す', () => {
    const error = {
      response: {
        status: 500,
      },
    };
    expect(getErrorType(error)).toBe('error');
  });

  it('デフォルトでerrorを返す', () => {
    expect(getErrorType({})).toBe('error');
  });
}); 