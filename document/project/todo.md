# 実装すべき画面のTODOリスト

## 認証関連画面
- [x] ログイン画面
  - [x] メールアドレス入力フィールド
  - [x] パスワード入力フィールド（パスワード表示切替機能付き）
  - [x] 「ログイン」ボタン
  - [x] 「パスワードをお忘れですか？」リンク
  - [x] 「アカウントをお持ちでない場合: 新規登録」リンク
  - [x] ログイン状態の保持
  - [x] エラーメッセージ表示

- [x] 新規登録画面
  - [x] 氏名入力フィールド
  - [x] メールアドレス入力フィールド
  - [x] パスワード入力フィールド
  - [x] パスワード確認入力フィールド
  - [x] 「登録」ボタン
  - [x] 「アカウントをお持ちの場合: ログイン」リンク
  - [x] 入力バリデーション
  - [x] エラーメッセージ表示

- [x] パスワードリセット要求画面
  - [x] メールアドレス入力フィールド
  - [x] 「リセットリンクを送信」ボタン
  - [x] 「ログイン画面に戻る」リンク
  - [x] 送信完了メッセージ

- [x] パスワードリセット実行画面
  - [x] 新しいパスワード入力フィールド
  - [x] 新しいパスワード確認入力フィールド
  - [x] 「パスワードを更新」ボタン
  - [x] トークン検証機能
  - [x] 更新完了メッセージ

## 質問関連画面
- [x] 質問作成画面
  - [x] プロジェクト選択ドロップダウン
  - [x] 質問タイトル入力フィールド
  - [x] 質問内容入力（リッチテキストエディタ）
  - [x] 担当者選択
  - [x] 回答期限設定（DatePicker）
  - [x] 優先度選択
  - [x] タグ選択
  - [x] 回答形式選択（自由記述/フォーム）
  - [x] 回答フォームビルダー
  - [x] 「作成」ボタン
  - [x] 「キャンセル」ボタン

- [x] 質問編集画面
  - [x] 既存質問情報の読み込み表示
  - [x] 質問タイトル編集
  - [x] 質問内容編集
  - [x] 担当者変更
  - [x] 回答期限変更
  - [x] 優先度変更
  - [x] タグ変更
  - [x] 回答形式変更
  - [x] 「更新」ボタン
  - [x] 「キャンセル」ボタン

- [x] 担当中の質問一覧画面
  - [x] 検索フィルター（キーワード、プロジェクト、ステータス、優先度、期限）
  - [x] 質問テーブル表示
  - [x] ソート機能
  - [x] ページネーション
  - [x] 期限切れ/近い質問の強調表示

## 通知関連画面
- [x] 通知ドロップダウン
  - [x] 最新5件の未読通知表示
  - [x] 「すべて既読にする」ボタン
  - [x] 「通知一覧へ」リンク
  - [x] 通知クリックで関連ページへの遷移

- [x] 通知一覧画面
  - [x] 「未読のみ表示」フィルター
  - [x] 「すべて既読にする」ボタン
  - [x] 通知リスト表示
  - [x] 無限スクロールまたはページネーション
  - [x] 通知クリックで関連ページへの遷移

## 管理者機能画面
- [x] ユーザー管理画面
  - [x] ユーザー検索機能
  - [x] ユーザーテーブル表示
  - [x] 役割（ADMIN/USER）変更機能
  - [x] ユーザー削除機能
  - [x] ページネーション

## その他機能拡張
- [x] レスポンシブデザイン対応
  - [x] モバイル対応（xs / sm）
  - [x] タブレット対応（md）
  - [x] デスクトップ対応（lg / xl）

- [x] アクセシビリティ対応
  - [x] キーボードアクセシビリティ
  - [x] スクリーンリーダー対応
  - [x] 適切なコントラスト比
  - [x] 拡大表示対応

- [x] ダークモード対応
  - [x] ダークモードテーマ作成
  - [x] テーマ切替機能
  - [x] ユーザー設定の保存

## モックデータ対応箇所（API呼び出し）

- [x] src/hooks/useAuth.ts: 認証フックでのAPI呼び出し
- [x] src/app/components/notifications/NotificationsPage.tsx: 通知一覧画面
- [x] src/app/components/layout/Header.tsx: ヘッダーの通知関連
- [x] src/app/components/layout/Sidebar.tsx: サイドバーの通知カウント
- [x] src/app/stores/authStore.ts: 認証ストア
- [x] src/app/stores/projectStore.ts: プロジェクトストア
- [x] src/app/stores/notificationStore.ts: 通知ストア
- [x] src/app/stores/questionStore.ts: 質問ストア（存在しない）
- [x] src/app/admin/users/page.tsx: ユーザー管理画面
- [x] src/app/settings/page.tsx: ユーザー設定画面
- [x] src/app/search/page.tsx: 検索画面（実装なし）
- [x] src/app/projects/page.tsx: プロジェクト一覧画面
- [x] src/app/projects/[id]/page.tsx: プロジェクト詳細画面
- [x] src/app/projects/create/page.tsx: プロジェクト作成画面（存在しない）
- [x] src/app/questions/page.tsx: 質問一覧画面
- [x] src/app/questions/[id]/page.tsx: 質問詳細画面
- [x] src/app/questions/create/page.tsx: 質問作成画面

### 直接fetchを使用している要対応箇所
- [x] src/app/search/page.tsx
  - [x] プロジェクト一覧取得: `await fetch('/api/projects')` → `fetchData<any>('projects')`に修正済み
  - [x] ユーザー一覧取得: `await fetch('/api/users?limit=100')` → `fetchData<any>('users', { params })`に修正済み
  - [x] タグ一覧取得: `await fetch(/api/projects/${projectId}/tags)` → `fetchData<any>('projects/${projectId}/tags')`に修正済み
  - [x] 質問一覧検索: `await fetch(/api/questions?${queryParams})` → `fetchData<any>('questions', { params })`に修正済み
- [x] src/app/settings/page.tsx
  - [x] ユーザー情報取得: `await fetch('/api/auth/me')` → すでに`fetchData<{name: string; email: string}>('auth/me')`を使用
  - [x] ユーザー情報更新: `await fetch('/api/users/me')` → すでに`fetchData<{name: string; email: string}>('users/me', {...})`を使用
  - [x] パスワード変更: `await fetch('/api/users/change-password')` → すでに`fetchData<{success: boolean}>('users/change-password', {...})`を使用
- [x] src/app/stores/authStore.ts
  - [x] ログイン: `await fetch('/api/auth/login')` → すでに`fetchData<{ user: User; token: string }>('auth/login', {...})`を使用
  - [x] 登録: `await fetch('/api/auth/register')` → すでに`fetchData<{ id: string; email: string }>('auth/register', {...})`を使用
  - [x] パスワードリセット関連: 複数の関数 → すべての関数でfetchDataを使用済み
  - [x] ユーザー情報取得: `await fetch('/api/auth/me')` → すでに`fetchData<User>('auth/me', {})`を使用
  - [x] ユーザープロジェクト取得: `await fetch('/api/users/me/projects')` → すでに`fetchData<ProjectMember[]>('users/me/projects', {})`を使用
- [x] src/app/stores/notificationStore.ts
  - [x] 通知一覧取得・既読設定: 複数の関数 → すべての関数でfetchDataを使用済み
- [x] src/app/stores/projectStore.ts
  - [x] プロジェクト一覧/詳細/作成/更新: 複数の関数 → すべての関数でfetchDataを使用済み
  - [x] タグ管理: 複数の関数 → すべての関数でfetchDataを使用済み
  - [x] メンバー招待/管理: 複数の関数 → すべての関数でfetchDataを使用済み

### 対応状況まとめ
- [x] src/app/search/page.tsx - 修正完了（直接fetchからfetchDataに変更）
- [x] src/app/settings/page.tsx - 対応済み（既にfetchData関数を使用）
- [x] src/app/stores/authStore.ts - 対応済み（既にfetchData関数を使用）
- [x] src/app/stores/notificationStore.ts - 対応済み（既にfetchData関数を使用）
- [x] src/app/stores/projectStore.ts - 対応済み（既にfetchData関数を使用）
- [x] src/app/components/notifications/NotificationsPage.tsx - 対応済み（既にfetchData関数を使用）

### 認証関連コンポーネント
- [x] src/app/components/auth/LoginForm.tsx: ログインフォーム
- [x] src/app/components/auth/RegisterForm.tsx: ユーザー登録フォーム
- [x] src/app/components/auth/PasswordResetForm.tsx: パスワードリセットフォーム

### 質問関連コンポーネント
- [x] src/app/components/questions/QuestionList.tsx: 質問一覧表示
- [x] src/app/components/questions/QuestionForm.tsx: 質問作成・編集フォーム
- [x] src/app/components/questions/AnswerForm.tsx: 回答投稿フォーム
- [x] src/app/components/questions/QuestionDetail.tsx: 質問詳細表示

### プロジェクト関連コンポーネント
- [x] src/app/components/projects/ProjectList.tsx: プロジェクト一覧表示
- [x] src/app/components/projects/ProjectForm.tsx: プロジェクト作成・編集フォーム
- [x] src/app/components/projects/ProjectMembersList.tsx: プロジェクトメンバー管理
- [x] src/app/components/projects/ProjectTagsManager.tsx: プロジェクトタグ管理

### ユーザー関連コンポーネント
- [x] src/app/components/users/UserList.tsx: ユーザー一覧表示
- [x] src/app/components/users/ProfileSettings.tsx: プロフィール設定

### 検索関連コンポーネント
- [x] src/app/components/search/SearchForm.tsx: 検索フォーム
- [x] src/app/components/search/SearchResults.tsx: 検索結果表示
