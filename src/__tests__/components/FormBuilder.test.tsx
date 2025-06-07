import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormBuilder, { FormField, FieldType } from '@/app/components/questions/FormBuilder';

describe('FormBuilder', () => {
  const mockOnChange = jest.fn();
  
  const defaultProps = {
    fields: [] as FormField[],
    onChange: mockOnChange,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('空の状態で正しくレンダリングされる', () => {
    render(<FormBuilder {...defaultProps} />);
    
    expect(screen.getByText('回答フォームの設定')).toBeInTheDocument();
    expect(screen.getByText('フォームフィールドがありません')).toBeInTheDocument();
    expect(screen.getByText('フィールドを追加')).toBeInTheDocument();
    expect(screen.getByText('プレビュー')).toBeDisabled();
  });

  it('フィールドがある場合、正しく表示される', () => {
    const fields: FormField[] = [
      {
        id: 'field1',
        label: 'お名前',
        fieldType: FieldType.TEXT,
        isRequired: true,
        order: 0,
      },
      {
        id: 'field2',
        label: '年齢',
        fieldType: FieldType.NUMBER,
        isRequired: false,
        order: 1,
      },
    ];

    render(<FormBuilder {...defaultProps} fields={fields} />);
    
    expect(screen.getByText('お名前')).toBeInTheDocument();
    expect(screen.getByText('年齢')).toBeInTheDocument();
    expect(screen.getByText('テキスト入力')).toBeInTheDocument();
    expect(screen.getByText('数値入力')).toBeInTheDocument();
    expect(screen.getByText('必須')).toBeInTheDocument();
    expect(screen.getByText('プレビュー')).toBeEnabled();
  });

  it('フィールド追加ダイアログが開く', async () => {
    render(<FormBuilder {...defaultProps} />);
    
    const addButton = screen.getByText('フィールドを追加');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('新しいフィールドを追加')).toBeInTheDocument();
    });
  });

  it('新しいフィールドを追加できる', async () => {
    render(<FormBuilder {...defaultProps} />);
    
    // フィールド追加ボタンをクリック
    fireEvent.click(screen.getByText('フィールドを追加'));
    
    await waitFor(() => {
      expect(screen.getByText('新しいフィールドを追加')).toBeInTheDocument();
    });
    
    // フォームに入力
    const labelInput = screen.getByRole('textbox', { name: /ラベル/i });
    fireEvent.change(labelInput, { target: { value: 'テストフィールド' } });
    
    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: '保存' });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          label: 'テストフィールド',
          fieldType: FieldType.TEXT,
          isRequired: false,
          order: 0,
        }),
      ]);
    });
  });

  it('ラジオボタンフィールドで選択肢を追加できる', async () => {
    render(<FormBuilder {...defaultProps} />);
    
    // フィールド追加ダイアログを開く
    fireEvent.click(screen.getByText('フィールドを追加'));
    
    await waitFor(() => {
      expect(screen.getByText('新しいフィールドを追加')).toBeInTheDocument();
    });
    
    // ラベルを入力
    const labelInput = screen.getByRole('textbox', { name: /ラベル/i });
    fireEvent.change(labelInput, { target: { value: '選択肢' } });
    
    // フィールドタイプをラジオボタンに変更
    const typeSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(typeSelect);
    
    await waitFor(() => {
      const radioOption = screen.getByRole('option', { name: 'ラジオボタン' });
      fireEvent.click(radioOption);
    });
    
    // 選択肢を追加
    const optionInput = screen.getByPlaceholderText('選択肢を追加');
    fireEvent.change(optionInput, { target: { value: '選択肢1' } });
    fireEvent.click(screen.getByRole('button', { name: '追加' }));
    
    fireEvent.change(optionInput, { target: { value: '選択肢2' } });
    fireEvent.click(screen.getByRole('button', { name: '追加' }));
    
    // 保存
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          label: '選択肢',
          fieldType: FieldType.RADIO,
          options: ['選択肢1', '選択肢2'],
        }),
      ]);
    });
  });

  it('フィールドを削除できる', () => {
    const fields: FormField[] = [
      {
        id: 'field1',
        label: '削除されるフィールド',
        fieldType: FieldType.TEXT,
        isRequired: false,
        order: 0,
      },
    ];

    render(<FormBuilder {...defaultProps} fields={fields} />);
    
    const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
    fireEvent.click(deleteButton!);
    
    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('disabled状態で操作できない', () => {
    const fields: FormField[] = [
      {
        id: 'field1',
        label: 'テストフィールド',
        fieldType: FieldType.TEXT,
        isRequired: false,
        order: 0,
      },
    ];

    render(<FormBuilder {...defaultProps} fields={fields} disabled={true} />);
    
    expect(screen.getByText('フィールドを追加')).toBeDisabled();
    expect(screen.getByTestId('EditIcon').closest('button')).toBeDisabled();
    expect(screen.getByTestId('DeleteIcon').closest('button')).toBeDisabled();
  });

  it('プレビューダイアログが開く', async () => {
    const fields: FormField[] = [
      {
        id: 'field1',
        label: 'プレビューフィールド',
        fieldType: FieldType.TEXT,
        isRequired: true,
        order: 0,
      },
    ];

    render(<FormBuilder {...defaultProps} fields={fields} />);
    
    const previewButton = screen.getByText('プレビュー');
    fireEvent.click(previewButton);
    
    await waitFor(() => {
      expect(screen.getByText('フォームプレビュー')).toBeInTheDocument();
      expect(screen.getByText('これは作成したフォームのプレビューです。実際の回答画面での表示を確認できます。')).toBeInTheDocument();
    });
  });
}); 