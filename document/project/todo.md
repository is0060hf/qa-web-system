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

## 🔧 重要度：中 - 機能は動作するが改善が必要

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
- [ ] 添付ファイル関連APIの完全実装
  - [ ] `/api/attachments/[fileId]` - ファイルダウンロード
  - [ ] `/api/attachments/[fileId]/metadata` - ファイルメタデータ取得
  - [ ] ファイル削除エンドポイント
  
- [ ] ログ機能の実装
  - [ ] 構造化ログライブラリ（Winston、Pino等）の導入
  - [ ] アクセスログ
  - [ ] エラーログ
  - [ ] 監査ログ（重要な操作の記録）
  
- [ ] バックアップ機能
  - [ ] データベースの定期バックアップ
  - [ ] アップロードファイルのバックアップ

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

- [ ] テスト環境の改善（2025/06/06 追加）
  - [ ] NextRequestのモック方法の修正
    - 現在の問題：`Cannot set property url of #<NextRequest> which has only a getter`
    - 多くのAPIテストで発生（auth-login, auth-register, projects-create等）
    - NextRequestの正しいモック方法の実装が必要
  - [ ] TextDecoderのポリフィル追加
    - 現在の問題：`ReferenceError: TextDecoder is not defined`
    - media.test.tsで発生
    - jest/setupTests.jsにTextDecoderのポリフィルを追加
  - [ ] Prismaモックの拡張
    - 現在の問題：`Cannot read properties of undefined (reading 'findMany')`
    - prisma.projectTagのモックが不足
    - 完全なPrismaモックオブジェクトの作成が必要
  - [ ] ESモジュール対応
    - 現在の問題：`Unexpected token 'export'` (joseライブラリ)
    - middleware/auth.test.tsで発生
    - Jest設定でESモジュールのトランスフォーム設定が必要

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

## 🐛 既知のバグ

### 機能的なバグ
- [x] ~~検索ページでの質問検索が動作しない（APIエンドポイント未実装）~~ → 2025/06/06 解決済み
- [x] ~~パスワードリセット機能が完全に動作しない（トークン管理未実装）~~ → 2025/06/06 解決済み
- [ ] ファイルアップロード後の表示/ダウンロードが不完全

### UI/UXのバグ
- [ ] モバイル表示での一部レイアウト崩れ
- [ ] ダークモード時の一部コンポーネントの視認性問題
- [ ] 長いテキストでのオーバーフロー処理不足

### セキュリティのバグ
- [ ] セッション管理の脆弱性（JWT有効期限の適切な設定）
- [ ] ファイルアップロードのバリデーション不足
- [ ] SQLインジェクション対策の不足（Prismaを使用しているため低リスクだが確認必要）

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
