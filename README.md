# 質問管理Webシステム - アクセシビリティと最適化実装

このプロジェクトは、プロジェクト内の質問と回答を効率的に管理するためのWebシステムです。

## アクセシビリティ機能

アクセシビリティ対応として、以下の機能を実装しました：

### AccessibilityProvider

`src/components/providers/AccessibilityProvider.tsx` に実装されたプロバイダーコンポーネントは、以下の機能を提供します：

- **スキップリンク**: キーボードユーザーがメインコンテンツに直接移動できる
- **キーボードフォーカススタイル**: キーボード操作時に視覚的フォーカスを強調
- **スクリーンリーダー対応**: 動的コンテンツの変更をスクリーンリーダーに通知
- **フォントサイズ調整**: ユーザーが文字サイズを変更可能
- **高コントラストモード**: 視覚障害者向けの高コントラスト表示モード

### useA11y フック

`src/hooks/useA11y.ts` に実装されたカスタムフックは、コンポーネントでのアクセシビリティ機能の使用を簡単にします：

- **スクリーンリーダー通知**: 動的な状態変更をスクリーンリーダーに通知
- **ページネーション支援**: キーボードでのページ間移動をサポート
- **フォーカス制御**: 要素を適切にフォーカス可能に設定
- **読み込み状態通知**: データ読み込み状態をスクリーンリーダーに通知
- **エラー通知**: フォームエラーをスクリーンリーダーに通知

## パフォーマンス最適化

パフォーマンス最適化として、以下の機能を実装しました：

### LazyImage コンポーネント

`src/components/ui/LazyImage.tsx` に実装された画像の遅延読み込みコンポーネント：

- **Intersection Observer**: 画像が表示領域に入った時のみ読み込み
- **プレースホルダー表示**: 読み込み中のスケルトン表示
- **優先度設定**: 重要な画像の優先読み込み設定
- **アクセシビリティ対応**: 読み込み状態をスクリーンリーダーに通知
- **ブラウザサポート**: JavaScript無効時のフォールバック対応

## 使用方法

### AccessibilityProvider の使用

```tsx
// src/app/layout.tsx などのルートコンポーネントで
import { AccessibilityProvider } from '@/components/providers/AccessibilityProvider';

export default function Layout({ children }) {
  return (
    <AccessibilityProvider>
      <main id="main-content">
        {children}
      </main>
    </AccessibilityProvider>
  );
}
```

### useA11y フックの使用

```tsx
import { useA11y } from '@/hooks/useA11y';

function MyComponent() {
  const { announce, handlePaginationKeyboard } = useA11y();
  
  // ページネーションのキーボード操作
  const keyboardHandler = handlePaginationKeyboard({
    currentPage: 1,
    totalPages: 10,
    onPageChange: (page) => setPage(page),
  });
  
  return (
    <div onKeyDown={keyboardHandler}>
      {/* ページネーションコンポーネント */}
    </div>
  );
}
```

### LazyImage コンポーネントの使用

```tsx
import LazyImage from '@/components/ui/LazyImage';

function ImageGallery() {
  return (
    <div>
      <LazyImage
        src="/images/example.jpg"
        alt="例の画像"
        width={300}
        height={200}
        priority={false}
      />
    </div>
  );
}
``` 