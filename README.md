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

## Claude AI Integration

このプロジェクトには、AIコーディングアシスタント「Claude」が統合されており、pre-commitフックでコードレビューを自動実行します。

### 前提条件

- Node.js 18以上
- Git
- npm または yarn

### セットアップ手順

1. **Claude CLIのインストール**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **動作確認**
   ```bash
   claude --help
   ```

3. **Git hooks有効化確認**
   ```bash
   # pre-commitフックは既に設定されています
   ls -la .git/hooks/pre-commit
   ```

### 基本的な使用方法

#### コマンドラインでの使用

```bash
# 対話モードでClaude AIを起動
claude

# 非対話モードでファイルをレビュー
claude --print "以下のコードをレビューしてください: $(cat src/app/page.tsx)"

# git diffをレビュー
claude --print "以下の変更をレビューしてください: $(git diff)"
```

#### エイリアスの使用（セットアップ後）

```bash
# エイリアスのセットアップ
./setup-claude-aliases.sh
source ~/.zshrc  # または ~/.bashrc

# 利用可能なエイリアス
cl              # Claude対話モード
clp             # Claude非対話モード（--print）
crf             # ファイルをレビュー
crd             # git diffをレビュー
crds            # ステージング済みの変更をレビュー
cap             # プロジェクト構造を分析
cfe             # エラー修正支援
cgc             # コンポーネント生成
cgt             # テスト生成
```

#### pre-commitフックでの自動レビュー

Gitコミット時に自動的にClaudeがコードをレビューします：

- TypeScript/JavaScriptファイルの変更を検出
- バグ、既存コンポーネントの再実装、可読性、テスト不足をチェック
- 問題がある場合は指摘事項を表示
- コミットを続行するか選択可能

#### VSCodeでの使用

VSCodeタスクランナーから以下のタスクを実行できます（`Cmd/Ctrl + Shift + P` → 「Tasks: Run Task」）：

- `Claude: 現在のファイルをレビュー` - 開いているファイルをレビュー
- `Claude: git diffをレビュー` - 未ステージングの変更をレビュー
- `Claude: ステージング変更をレビュー` - ステージング済みの変更をレビュー
- `Claude: 対話モードを開始` - Claudeとの対話セッションを開始

### トラブルシューティング

問題が発生した場合は、診断ツールを実行してください：

```bash
./debug-claude-setup.sh
```

このツールは以下をチェックします：
- claudeコマンドの存在
- Node.jsバージョン（18以上）
- Git hooksの権限
- 環境変数（ANTHROPIC_API_KEY）
- プロジェクト設定

### カスタマイズ

pre-commitフックは以下の観点でレビューを実行します：

- **バグの検出**: 明らかなバグやエラーの指摘
- **既存コンポーネントの活用**: 車輪の再発明を防ぐ
- **可読性の向上**: 複雑すぎる実装の改善提案
- **テストの必要性**: 新機能に対するテスト作成の提案

レビューの観点を変更したい場合は、`.git/hooks/pre-commit` ファイルのプロンプトを編集してください。

### 一般的なエラーと解決方法

1. **「claudeコマンドが見つかりません」**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **「レビューが失敗しました」**
   - APIキーが設定されていない可能性があります
   - ネットワーク接続を確認してください

3. **「Node.jsバージョンが古い」**
   - Node.js 18以上にアップグレードしてください
   - nvmを使用している場合: `nvm install 18 && nvm use 18`

4. **「pre-commitフックが動作しない」**
   ```bash
   chmod +x .git/hooks/pre-commit
   ```

詳細な使用方法については、`claude --help` コマンドを実行してください。 