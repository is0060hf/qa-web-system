# 実装すべき画面のTODOリスト

## 🚨 重要度：高 - 機能が動作しない/セキュリティリスクがある

### API/バックエンド
- [x] `/api/questions` エンドポイントの実装
  - [x] 質問一覧の取得（検索、フィルタリング、ページネーション対応）
  - [x] 検索ページ（`/search/page.tsx`）で使用されているが未実装
  - 実装済み：`src/app/api/questions/route.ts`に実装
  - 検索、フィルタリング（プロジェクト、担当者、ステータス、優先度、タグ、期限切れ）対応
  - ページネーション機能実装済み
  - ユーザー権限に応じた適切なデータフィルタリング実装済み
  
- [x] メール送信機能の実装
  - [x] `src/app/api/auth/request-password-reset/route.ts` - パスワードリセットメール
  - [x] `src/app/api/projects/[projectId]/invitations/route.ts` - 招待メール
  - [x] SendGridやAWS SESなどのメールサービスの統合
  - 実装済み：`src/lib/utils/email.ts`にメール送信ユーティリティを作成
  - 開発環境用のダミーメール送信サービス実装済み
  - SendGridとAWS SES用のプレースホルダー実装済み
  - 各種メールテンプレート（パスワードリセット、プロジェクト招待、質問通知等）作成済み
  - `.env.example`に必要な環境変数を文書化
  
- [x] PasswordResetTokenモデルの追加
  - [x] Prismaスキーマにモデル定義を追加
  - [x] マイグレーションの実行
  - [x] パスワードリセットトークンの有効期限管理
  - 実装済み：`prisma/schema.prisma`にPasswordResetTokenモデルを追加
  - マイグレーション実行済み（20250606040138_add_password_reset_token）
  - パスワードリセットAPIでトークンの作成、検証、使用済み処理を実装
  - トークン有効期限は1時間に設定
  
### セキュリティ
- [x] CORS設定の実装
  - [x] Next.jsのミドルウェアでCORSヘッダーを設定
  - [x] 許可するオリジンの設定
  
- [x] XSS対策の強化
  - [x] ユーザー入力のサニタイズ処理
  - [x] Content Security Policy (CSP) ヘッダーの設定
  
- [x] CSRF対策の実装
  - [x] CSRFトークンの生成と検証
  
- [x] レート制限の実装
  - [x] APIエンドポイントへのリクエスト制限
  - [x] ブルートフォース攻撃対策

### プロフィール画像機能の残作業（2025/01/14 完了）
- [x] 質問一覧・詳細画面でのプロフィール画像表示
  - [x] 質問詳細ページ（`/questions/[id]/page.tsx`）のユーザーアバター更新
  - [x] 質問一覧ページでのアバター表示更新
  - [x] プロジェクト詳細ページでのメンバーアバター更新
- [x] APIレスポンスにプロフィール画像情報を含める
  - [x] 質問関連APIでユーザー情報にprofileImageを含める
  - [x] プロジェクトメンバー一覧APIでプロフィール画像を含める
- [x] プロフィール画面への遷移修正
  - [x] ヘッダーのユーザーメニューからプロフィール・設定画面へ遷移できるように修正
  - [x] ログアウト機能の実装
- [x] エラーハンドリングの改善（Claudeレビューより）
  - [x] UserSettingsFormのアラートを既存のErrorMessageコンポーネントに置き換える
  - [x] 画像アップロード/削除のエラーハンドリング強化

## 🔧 重要度：中 - 機能は動作するが改善が必要

### MUIコンポーネントの型エラー修正（2025/01/15 完了）
- [x] Gridコンポーネントのitemプロパティエラーへの対応
  - MUI v6でGridコンポーネントの型定義が変更された可能性
  - Grid2への移行を検討
  - 影響箇所：
    - `src/app/components/search/SearchForm.tsx`
    - `src/app/questions/edit/[id]/page.tsx`
    - その他Gridコンポーネントを使用している箇所
  - 実装済み：Gridコンポーネントは使用されていないことを確認
- [x] FormSelectFieldの型定義の改善
  - onChangeハンドラーの型互換性の問題を根本的に解決
  - 実装済み：`SelectChangeEvent<string>`型を使用するように修正
  - `as any`を削除し、型安全性を向上
- [x] Chipコンポーネントのcolor型エラー修正
  - 実装済み：`src/lib/utils/muiHelpers.ts`にヘルパー関数を作成
  - `getStatusChipColor`、`getPriorityChipColor`、`getProjectStatusChipColor`関数を実装
  - 全ての`as any`を削除し、型安全性を向上

### UI/UX
- [x] フォームビルダーUIの実装
  - [x] `src/app/components/questions/QuestionForm.tsx` - 370行目のTODOコメント
  - [x] ドラッグ&ドロップでフィールドを追加/並び替え
  - [x] フィールドタイプの選択UI
  - [x] プレビュー機能
  - 実装済み：`src/app/components/questions/FormBuilder.tsx`を作成
  - フィールドの追加・編集・削除・並び替え機能実装済み
  - プレビューダイアログでリアルタイムプレビュー可能
  
- [x] ファイルアップロード機能の改善
  - [x] プログレスバーの実装
  - [x] ファイルサイズ制限の明確な表示
  - [x] 複数ファイルの一括アップロード
  - [x] アップロード済みファイルのプレビュー機能
  - 実装済み：`src/app/components/common/FormFileUpload.tsx`を改善
  - アップロード進捗バー追加
  - 画像ファイルのサムネイルプレビュー機能追加
  - ファイルタイプ別アイコン表示
  - 残りアップロード可能ファイル数の表示
  
- [x] エラーハンドリングの統一
  - [x] グローバルエラーハンドラーの実装
  - [x] ユーザーフレンドリーなエラー表示
  - 実装済み：`src/app/components/common/ErrorBoundary.tsx`を作成
  - 実装済み：`src/app/components/common/ErrorMessage.tsx`を作成
  - エラータイプ別の表示（エラー、警告、ネットワーク、バリデーション）
  - 詳細情報の折りたたみ表示機能
  - 再試行ボタンの実装

### API/バックエンド
- [x] 添付ファイル関連APIの完全実装
  - [x] `/api/attachments/[fileId]` - ファイルダウンロード
  - [x] `/api/attachments/[fileId]/metadata` - ファイルメタデータ取得
  - [x] ファイル削除エンドポイント
  - 実装済み：`src/app/api/attachments/[fileId]/route.ts`
  - GET（ダウンロード/メタデータ取得）、DELETE（削除）メソッド実装
  - アクセス権限チェック（管理者、アップロード者、プロジェクトメンバー）
  - 使用中のファイルは削除不可
  
- [x] ログ機能の実装
  - [x] 構造化ログライブラリ（Winston、Pino等）の導入
  - [x] アクセスログ
  - [x] エラーログ
  - [x] 監査ログ（重要な操作の記録）
  - 実装済み：`src/lib/utils/logger.ts`
  - Pinoを使用した構造化ログシステム
  - 開発環境と本番環境で異なる設定
  - withLogging HOCでAPIハンドラーをラップ
  - 使用例：`src/app/api/projects/route.ts`、`src/app/api/attachments/[fileId]/route.ts`
  
- [x] バックアップ機能
  - [x] データベースの定期バックアップ
  - [x] アップロードファイルのバックアップ
  - 実装済み：`scripts/backup.ts`
  - pg_dumpを使用したPostgreSQLバックアップ
  - メディアファイルのメタデータ保存
  - 古いバックアップの自動削除（保持期間設定可能）
  - package.jsonにバックアップコマンド追加：`npm run backup`

### パフォーマンス
- [ ] キャッシュ戦略の実装
  - [ ] Redisの導入検討
  - [ ] APIレスポンスのキャッシュ
  - [ ] 静的アセットのキャッシュ設定
  
- [ ] データベースクエリの最適化
  - [ ] N+1問題の解決
  - [ ] インデックスの最適化
  - [ ] 大量データ処理の改善

## 📝 重要度：低 - 改善により開発効率/保守性が向上

### ドキュメント
- [ ] 環境変数の設定ドキュメント
  - [ ] 必要な環境変数の一覧と説明
  - [ ] `.env.example` ファイルの作成
  - [ ] 各環境（開発/ステージング/本番）での設定方法
  
- [ ] APIドキュメントの自動生成
  - [ ] OpenAPI/Swagger仕様書の作成
  - [ ] APIエンドポイントの一覧と使用方法
  
- [ ] デプロイメントガイド
  - [ ] Vercelへのデプロイ手順
  - [ ] データベースのセットアップ
  - [ ] 環境変数の設定

### テスト
- [ ] E2Eテストの追加
  - [ ] Cypress/Playwrightの導入
  - [ ] 主要なユーザーフローのテスト
  
- [ ] 統合テストの拡充
  - [ ] APIエンドポイントの統合テスト
  - [ ] データベーストランザクションのテスト
  
- [ ] パフォーマンステスト
  - [ ] 負荷テストツールの導入
  - [ ] APIレスポンスタイムの測定

- [x] テスト環境の改善（2025/06/06 追加）
  - [x] NextRequestのモック方法の修正
    - ~~現在の問題：`Cannot set property url of #<NextRequest> which has only a getter`~~
    - ~~多くのAPIテストで発生（auth-login, auth-register, projects-create等）~~
    - ~~NextRequestの正しいモック方法の実装が必要~~
    - 解決済み：MockNextRequestクラスを作成し、すべてのgetterプロパティを適切に定義
  - [x] TextDecoderのポリフィル追加
    - ~~現在の問題：`ReferenceError: TextDecoder is not defined`~~
    - ~~media.test.tsで発生~~
    - ~~jest/setupTests.jsにTextDecoderのポリフィルを追加~~
    - 解決済み：TextDecoderとTextEncoderのポリフィルを実装
  - [x] Prismaモックの拡張
    - ~~現在の問題：`Cannot read properties of undefined (reading 'findMany')`~~
    - ~~prisma.projectTagのモックが不足~~
    - ~~完全なPrismaモックオブジェクトの作成が必要~~
    - 解決済み：すべての必要なモデル（projectTag、projectMember、passwordResetToken、thread）を追加
  - [x] ESモジュール対応
    - ~~現在の問題：`Unexpected token 'export'` (joseライブラリ)~~
    - ~~middleware/auth.test.tsで発生~~
    - ~~Jest設定でESモジュールのトランスフォーム設定が必要~~
    - 解決済み：transformIgnorePatternsにjoseを追加、babel.config.jsを作成して適切な設定を実装

### 開発環境
- [ ] Docker環境の整備
  - [ ] `docker-compose.yml` の作成
  - [ ] 開発環境の統一化
  
- [ ] CI/CDパイプラインの改善
  - [ ] 自動テストの実行
  - [ ] コードカバレッジのレポート
  - [ ] 自動デプロイの設定

### コード品質
- [ ] TypeScriptの型定義の改善
  - [ ] `any` 型の削減
  - [ ] 共通の型定義ファイルの整理
  
- [ ] コンポーネントの再利用性向上
  - [ ] 共通コンポーネントの抽出
  - [ ] Storybookの導入検討
  
- [ ] コードの重複削減
  - [ ] 共通処理のユーティリティ化
  - [ ] カスタムフックの作成

- [ ] テストとコード品質の改善（2025/06/06 Claudeレビューより）
  - [ ] jest/setupTests.jsのWeb APIモック実装を改善
    - Headers、FormDataクラスのより完全な実装
  - [ ] ErrorBoundaryテストのフック使用方法を修正
    - コンポーネント外でのuseState使用を修正
  - [ ] ErrorMessageのエラーハンドリングロジック改善
    - オフライン判定とネットワークエラー判定の順序を最適化
  - [ ] FormFileUploadのメモリリーク対策
    - コンポーネントアンマウント時にプレビューURLを解放
  - [ ] FormBuilderのアクセシビリティ向上
    - キーボード操作でのフィールド並び替えサポート
    - フィールド順序変更時のフォーカス維持
  - [ ] リファクタリング時のコンポーネント再利用の徹底
    - 既存のコンポーネントがある場合は、可能な限り再利用を検討
    - TruncatedTextのような共通コンポーネントを適切に活用
  - [ ] API型定義の一貫性向上
    - APIレスポンスの型は実際のAPIの戻り値と一致させる
    - 型の再利用を促進（例：Notification型など）
  - [ ] コンポーネントAPIの後方互換性維持
    - プロップの変更時は、既存の使用箇所への影響を考慮
    - 破壊的変更を避け、オプショナルなプロップで拡張

- [ ] 質問回答権限機能の改善（2025/01/14 Claudeレビューより）
  - [ ] 既存のErrorMessageコンポーネントを活用
    - 回答権限エラー画面で統一されたエラー表示を使用
  - [ ] Material-UIのTooltipコンポーネントの活用
    - 無効化されたボタンのツールチップ表示を改善
  - [ ] 質問詳細画面の権限チェックテストの追加
    - 担当者の場合: 回答ボタンが有効
    - 担当者以外の場合: 回答ボタンが無効
    - 未ログインの場合の動作
    - 権限エラー画面の表示確認

### トースト通知システムの改善（2025/01/17 完了）
- [x] ブラウザデフォルトalert()の置き換え
  - Material-UIのSnackbarを使用したトースト通知システムを実装
  - `src/components/common/Toast.tsx`にトーストコンポーネント作成
  - `src/components/providers/ToastProvider.tsx`にコンテキストプロバイダー作成
  - `src/hooks/useToast.ts`にカスタムフック作成
  - 4種類のトーストタイプ（success、error、warning、info）をサポート
  - 複数トーストの同時表示と自動削除機能
  - 右下からのスライドアニメーション
  - 全ページ共通で使用可能な再利用可能コンポーネント
- [x] 既存のalert()をトースト通知に置き換え
  - 質問詳細画面のステータス更新とコメント投稿
  - プロジェクト詳細画面のメンバー招待
  - ToastProviderをrootレイアウトに追加

- [ ] 認証・セキュリティの改善（2025/01/17 Claudeレビューより）
  - [ ] JWTリフレッシュトークンの完全実装
    - /api/auth/refreshエンドポイントの実装
    - クライアント側での自動リフレッシュ機能
    - 環境変数JWT_REFRESH_SECRETの本番環境での必須化
  - [ ] ファイルバリデーションのテスト追加
    - sanitizeFileName関数のパストラバーサル攻撃防止テスト
    - validateFile関数の各種バリデーションロジックテスト
    - validateFileMagicNumber関数のマジックナンバー照合テスト
  - [ ] TruncatedTextコンポーネントのリファクタリング
    - MUI標準のTypography noWrapプロパティへの置き換え検討
  - [ ] DataTableコンポーネントの簡略化
    - 複雑な条件分岐ロジックの整理
    - formatプロパティ内でTruncatedTextを返すように統一

## 🐛 既知のバグ

### 機能的なバグ
- [x] ~~検索ページでの質問検索が動作しない（APIエンドポイント未実装）~~ → 2025/06/06 解決済み
- [x] ~~パスワードリセット機能が完全に動作しない（トークン管理未実装）~~ → 2025/06/06 解決済み
- [ ] ファイルアップロード後の表示/ダウンロードが不完全

### UI/UXのバグ
- [x] ~~モバイル表示での一部レイアウト崩れ~~ → 2025/01/17 解決済み
- [x] ~~ダークモード時の一部コンポーネントの視認性問題~~ → 2025/01/17 解決済み（既存のThemeProviderで対応済み）
- [x] ~~長いテキストでのオーバーフロー処理不足~~ → 2025/01/17 解決済み（TruncatedTextコンポーネント実装）

### セキュリティのバグ
- [x] ~~セッション管理の脆弱性（JWT有効期限の適切な設定）~~ → 2025/01/17 解決済み（アクセストークン30分、リフレッシュトークン7日に設定）
- [x] ~~ファイルアップロードのバリデーション不足~~ → 2025/01/17 解決済み（包括的なファイルバリデーション実装）
- [x] ~~SQLインジェクション対策の不足（Prismaを使用しているため低リスクだが確認必要）~~ → 2025/01/17 確認済み（Prismaが適切にエスケープ処理を実施）

## 🔍 調査が必要な項目

- [ ] リアルタイム通知機能の実装方法（WebSocket/Server-Sent Events）
- [ ] 大規模ファイルアップロードの最適化（チャンクアップロード）
- [ ] アクセシビリティ（WCAG 2.2）準拠の詳細確認
- [ ] パフォーマンス監視ツールの導入（Sentry、DataDog等）

## 📅 実装優先順位

1. **緊急対応が必要**
   - ~~`/api/questions` エンドポイントの実装~~ ✅ 完了
   - ~~PasswordResetTokenモデルの追加~~ ✅ 完了
   - 基本的なセキュリティ対策

2. **早期に対応すべき**
   - ~~メール送信機能の実装~~ ✅ 完了（開発環境用のダミー実装済み、本番環境用の設定は別途必要）
   - ログ機能の実装
   - ~~エラーハンドリングの改善~~ ✅ 完了

3. **計画的に対応**
   - ~~フォームビルダーUIの実装~~ ✅ 完了
   - ドキュメントの整備
   - テストの拡充

4. **長期的な改善**
   - パフォーマンス最適化
   - コード品質の向上
   - 開発環境の改善

## 📌 完了済みタスクの追加設定

### メール送信機能（2025/06/06 実装）
現在は開発環境用のダミー実装のみ。本番環境での有効化には以下が必要：

**SendGridを使用する場合：**
- `npm install @sendgrid/mail`
- SendGrid APIキーを取得
- 環境変数設定：
  - `EMAIL_PROVIDER=sendgrid`
  - `SENDGRID_API_KEY=your-api-key`
  - `EMAIL_FROM=noreply@yourdomain.com`

**AWS SESを使用する場合：**
- `npm install @aws-sdk/client-ses`
- AWS認証情報を設定
- 環境変数設定：
  - `EMAIL_PROVIDER=aws-ses`
  - `AWS_REGION=your-region`
  - `AWS_ACCESS_KEY_ID=your-key`
  - `AWS_SECRET_ACCESS_KEY=your-secret`
  - `EMAIL_FROM=noreply@yourdomain.com`

### パスワードリセット機能（2025/06/06 実装）
- トークン有効期限：1時間
- URLパターン：`/reset-password/[token]`
- 使用済みトークンは自動削除
- 複数の未使用トークンがある場合、新規作成時に古いトークンを削除

### 質問検索API（2025/06/06 実装）
- エンドポイント：`/api/questions`
- 対応フィルター：
  - キーワード検索（タイトル、内容）
  - プロジェクトID
  - 担当者ID
  - ステータス
  - 優先度
  - タグID
  - 期限切れフラグ
- ページネーション対応（page, limit パラメータ）
- ユーザー権限に応じたデータフィルタリング実装済み

### フォームビルダーUI（2025/06/06 実装）
- コンポーネント：`src/app/components/questions/FormBuilder.tsx`
- 機能：
  - ドラッグ&ドロップによるフィールドの並び替え
  - フィールドタイプ：テキスト、数値、テキストエリア、ラジオボタン、ファイル
  - フィールドの追加・編集・削除
  - 必須/任意の設定
  - ラジオボタンの選択肢管理
  - リアルタイムプレビュー機能
- `QuestionForm.tsx`に統合済み

### ファイルアップロード機能改善（2025/06/06 実装）
- コンポーネント：`src/app/components/common/FormFileUpload.tsx`
- 改善内容：
  - アップロード進捗バー（LinearProgress使用）
  - 画像ファイルのサムネイルプレビュー
  - ファイルタイプ別アイコン表示
  - 残りアップロード可能ファイル数の表示
  - ファイルサイズとタイプの詳細表示
- 対応ファイルタイプ：画像、PDF、動画、音声、テキスト

### エラーハンドリング統一（2025/06/06 実装）
- **ErrorBoundary**（`src/app/components/common/ErrorBoundary.tsx`）
  - グローバルエラーキャッチ
  - ユーザーフレンドリーなエラー画面
  - 開発環境でのみエラー詳細を表示
  - 再試行とホーム画面への導線
- **ErrorMessage**（`src/app/components/common/ErrorMessage.tsx`）
  - 統一されたエラーメッセージコンポーネント
  - エラータイプ：error、warning、network、validation
  - 詳細情報の折りたたみ表示
  - 再試行ボタン
  - ヘルパー関数：getErrorMessage、getErrorType

### 質問管理機能の改善（2025/06/08 完了）
- [x] プロジェクト詳細画面の質問ステータスの日本語表記
  - 実装済み：`src/lib/utils/statusHelpers.ts`にヘルパー関数を作成
  - ステータス（新規、回答中、確認待ち、完了）の日本語表示
  - 優先度（最高、高、中、低）の日本語表示
- [x] 質問の優先度表示と緊急度インジケーター
  - 期限切れ・未回答の質問を最優先表示（critical）
  - 期限切れ・確認待ちの質問を高優先度表示（high）
  - 期限が近い質問（3日以内）の警告表示
  - 優先度別の色分け表示
- [x] 回答確認フローの実装
  - 質問詳細画面に「回答を確認して完了にする」ボタンを追加
  - ステータス更新APIエンドポイント（`/api/questions/[questionId]/status`）実装
  - 権限チェック（質問作成者、担当者、プロジェクトマネージャーのみ変更可能）
  - ステータス遷移のバリデーション実装
- [x] スレッド（コメント）機能の実装
  - Prismaスキーマに`Thread`モデルを追加
  - スレッドAPIエンドポイント（`/api/questions/[questionId]/answers/[answerId]/threads`）実装
  - 質問詳細画面でのスレッド表示・投稿機能
  - リアルタイムでのコメント追加
  - 通知機能との連携
- [x] 回答がついた場合の回答フォーム編集制限
  - 質問編集画面で回答有無をチェック
  - 回答がある場合はフォーム形式の変更を無効化
  - フィールドの追加・編集・削除も無効化
  - ユーザーへの分かりやすい通知メッセージ表示

### 通知機能の改善（2025/06/08 完了）
- [x] グローバルヘッダーの通知バッジを初期表示時から表示
  - コンポーネントマウント時に未読通知数を取得
  - 60秒ごとに自動更新
- [x] グローバルヘッダーの通知プルダウンで未読通知のみ表示
  - APIパラメータに`unread: 'true'`を追加
  - 念のため取得後もフィルタリング処理を実施
- [x] 通知一覧画面の「未読のみ表示」トグル修正
  - APIパラメータを`unreadOnly`から`unread`に修正
  - APIレスポンス型を最新のものに更新（`totalUnread`フィールド）
- [x] サイドバーの通知メニューバッジ表示（既に実装済み）
  - APIレスポンス型の修正のみ実施

### プロジェクト一覧画面の改善（2025/01/19 Claudeレビューより）
- [x] 型安全性の改善
  - APIレスポンス用の型定義を追加（ProjectAPIResponse）
  - 変換後のデータ型を明確化（ProjectWithCounts）
  - rawProjectsの型を明示的に指定
- [x] データ構造の整理
  - MockProjectインターフェースをAPI用と表示用に分離
  - MockProjectAPIResponseとMockProjectDisplayの型定義
- [x] エラーハンドリングの強化
  - `project._count?.questions` のundefined処理を `??` 演算子に変更
- [x] パフォーマンス最適化
  - データ変換処理をuseMemoでメモ化
  - 不要な再レンダリングを防止

### APIエンドポイントの動的レンダリング設定（2025/01/19 Claudeレビューより）
- [x] ユーザー固有データを返す他のAPIエンドポイントにも`force-dynamic`設定を追加
  - `/api/notifications/route.ts`
  - `/api/dashboard/route.ts`
  - `/api/questions/route.ts`
  - `/api/projects/route.ts`
  - `/api/users/me/route.ts`
  - 認証が必要でユーザー固有のデータを返すエンドポイントの一貫性確保

### コードクリーンアップ（2025/01/19 Claudeレビューより）
- [ ] 未使用インポートの削除
  - src/app/api/dashboard/route.ts: getUserFromRequestが未使用
  - src/app/api/questions/route.ts: validateRequest、createQuestionSchema、QuestionStatus、QuestionPriorityが未使用
- [ ] dashboard APIの認証処理改善
  - 手動JWT認証の代わりにgetUserFromRequest関数を使用
  - JWT_SECRETのフォールバック値（'fallback_secret'）を削除し、環境変数未設定時はエラーをスロー
- [ ] インポート文の統合
  - 同一モジュールからの複数インポートを1つにまとめる
- [ ] 型定義の重複解消
  - ProjectAPIResponseとMockProjectAPIResponseの共通化
  - src/types/project.tsに共通型定義を作成
