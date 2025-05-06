# 質問管理Webシステム 通知システム設計

## 1. 概要

本ドキュメントは、質問管理Webシステムにおける通知機能の設計を定義します。システム内で発生した特定のイベントに関連する情報をユーザーにリアルタイム（またはニアリアルタイム）で伝え、タスクの見逃し防止や状況把握を支援します。

## 2. 通知要件（再掲）

*   **通知タイミング:**
    *   自身が回答者で、回答期限が超過した場合。
    *   自身が質問者で、回答期限が超過した場合。
    *   自身が回答者として新しい質問が割り当てられた場合。
    *   自身の質問に対して回答が投稿された場合。
    *   自身が回答した質問がクローズされた場合。
*   **通知表示:**
    *   ヘッダー右上にベルアイコンと未読件数バッジを表示。
    *   ベルアイコンクリックで最新5件の通知ドロップダウン表示。
    *   通知一覧画面への導線。
*   **既読管理:** 通知は未読/既読状態を持ち、ユーザー操作で既読化。
*   **絞り込み:** 通知一覧画面で未読通知のみ表示可能。
*   **通知媒体:** Webシステム内のみ（メール通知は行わない）。

## 3. データモデル

Prismaスキーマで定義された `Notification` モデルを使用します。

```prisma
enum NotificationType {
  ASSIGNEE_DEADLINE_EXCEEDED // 回答者: 期限超過
  REQUESTER_DEADLINE_EXCEEDED // 質問者: 期限超過
  NEW_QUESTION_ASSIGNED     // 回答者: 新規割当
  NEW_ANSWER_POSTED         // 質問者: 新規回答
  ANSWERED_QUESTION_CLOSED  // 回答者: 回答済み質問クローズ
}

model Notification {
  id          String           @id @default(cuid())
  userId      String           // 通知を受け取るユーザーID
  type        NotificationType // 通知の種類
  message     String           // 表示するメッセージ本文
  relatedId   String?          // 関連エンティティID (主にQuestion ID)
  isRead      Boolean          @default(false) // 未読/既読フラグ
  createdAt   DateTime         @default(now())

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
}
```

## 4. 通知生成プロセス

通知は、関連するイベントが発生した際にバックエンドのサービスロジック内で生成され、データベースに保存されます。

*   **新規質問割り当て (`NEW_QUESTION_ASSIGNED`):**
    *   トリガー: 質問作成時 (`POST /api/projects/{projectId}/questions`) または質問編集で担当者が変更された時 (`PATCH /api/questions/{questionId}`)
    *   受信者: 新しく割り当てられた担当者 (`assigneeId`)
    *   処理: `Notification` レコードを作成。
*   **新規回答投稿 (`NEW_ANSWER_POSTED`):**
    *   トリガー: 回答投稿時 (`POST /api/questions/{questionId}/answers`)
    *   受信者: 該当質問の質問者 (`creatorId`)
    *   処理: `Notification` レコードを作成。
*   **回答済み質問クローズ (`ANSWERED_QUESTION_CLOSED`):**
    *   トリガー: 質問ステータスが `CLOSED` に変更された時 (`PATCH /api/questions/{questionId}/status`)
    *   受信者: 該当質問の最終回答者 (※実装注意: 最後に回答したユーザーを特定する必要があるか、あるいは担当者(`assigneeId`)で良いか確認。ここでは担当者とする)
    *   処理: `Notification` レコードを作成。
*   **期限超過 (`ASSIGNEE_DEADLINE_EXCEEDED`, `REQUESTER_DEADLINE_EXCEEDED`):**
    *   トリガー: 定期実行ジョブ（例: 1時間ごと、または1日1回実行）
    *   処理:
        1.  ステータスが `NEW` または `IN_PROGRESS` で、`deadline` が現在時刻を過ぎている質問を検索。
        2.  各該当質問について:
            *   回答者 (`assigneeId`) 向けの `ASSIGNEE_DEADLINE_EXCEEDED` 通知を作成（未通知の場合）。
            *   質問者 (`creatorId`) 向けの `REQUESTER_DEADLINE_EXCEEDED` 通知を作成（未通知の場合）。
        *   ※重複通知を防ぐため、特定の質問に対する期限超過通知は一度のみ生成する、または最後に生成された通知時刻を記録するなどの制御が必要。

## 5. APIエンドポイント（再掲）

API設計 (`api_design.md`) で定義されたエンドポイントを使用します。

*   `GET /api/notifications`: ユーザーの通知一覧を取得。
    *   Query Params: `unreadOnly=true/false`, `page=N`, `limit=N`
    *   レスポンスには通知リストに加え、未読件数 (`unreadCount`) も含める。
*   `PATCH /api/notifications/{notificationId}/read`: 特定の通知を既読にする。
*   `POST /api/notifications/read-all`: 全ての未読通知を既読にする。

## 6. フロントエンド実装

### 6.1. 通知アイコンとドロップダウン

*   **ヘッダー:**
    *   ベルアイコン (`<NotificationsIcon />` from Material UI) を配置。
    *   未読件数を取得 (`GET /api/notifications?limit=0` または専用API) し、バッジ (`<Badge badgeContent={unreadCount} color="error">`) を表示。
    *   アイコンクリックで `Menu` または `Popover` コンポーネントを表示。
*   **ドロップダウン:**
    *   `GET /api/notifications?limit=5&unreadOnly=true` (または全件取得して最新5件表示) で通知データを取得。
    *   `MenuItem` や `ListItem` で各通知を表示。
        *   通知タイプに応じたアイコン、メッセージ、相対時間 (`react-timeago` など) を表示。
        *   クリック時に `PATCH /api/notifications/{notificationId}/read` を呼び出し、関連ページ (例: `/questions/{relatedId}`) へ遷移。
    *   「すべて既読にする」ボタン (`POST /api/notifications/read-all` を呼び出し、UIを更新)。
    *   「通知一覧へ」リンク (`/notifications` ページへ遷移)。

### 6.2. 通知一覧画面

*   **パス:** `/notifications`
*   **データ取得:** `GET /api/notifications` (ページネーション対応)。React Query (`useInfiniteQuery` など) を使用して取得・キャッシュ管理。
*   **表示:**
    *   `Switch` または `Checkbox` で「未読のみ表示」フィルタリング (`unreadOnly` クエリパラメータを切り替え)。
    *   「すべて既読にする」ボタン。
    *   `List` コンポーネントで通知を一覧表示。
        *   各 `ListItem`: アイコン、メッセージ、関連情報、相対時間。
        *   クリック時に `PATCH /api/notifications/{notificationId}/read` を呼び出し、関連ページへ遷移。
    *   無限スクロールまたはページネーションコンポーネント。

### 6.3. 状態管理と更新

*   **未読件数:** Zustandストアで未読件数を管理。
*   **更新タイミング:**
    *   ページ読み込み時/再フォーカス時に `GET /api/notifications` を呼び出して未読件数と通知リストを更新 (React Queryの機能を利用)。
    *   **ニアリアルタイム更新:** 定期的なポーリング（例: 1分ごとに `GET /api/notifications?limit=0` を呼び出し、未読件数のみ更新）を実装し、ヘッダーのバッジを更新する。ドロップダウンや一覧画面は開かれたタイミングで最新情報を取得する。
    *   WebSocketやServer-Sent Events (SSE) は初期実装では見送り、必要に応じて将来的に検討。
*   **既読化:** 通知クリック時や「すべて既読」ボタン押下時にAPIを呼び出し、成功したらUIの状態（未読件数、通知リストの表示）を即時更新 (React Queryの `onSuccess` コールバックや `invalidateQueries` を利用)。

## 7. 定期実行ジョブ（期限超過通知）

*   **実装方法:** Vercel Cron Jobs や、別途サーバーレス関数 (例: AWS Lambda + EventBridge Scheduler, Google Cloud Scheduler + Cloud Functions) を利用して定期的にバックエンドの特定APIエンドポイント（例: `/api/cron/check-deadlines`）を叩く、またはPrismaの機能と連携できるスケジューラライブラリを利用。
*   **エンドポイント保護:** 定期実行ジョブ用のエンドポイントは、外部から不正に呼び出されないよう、シークレットキーやIP制限などで保護する。

## 8. 考慮事項

*   **通知メッセージ:** 各通知タイプに応じて、ユーザーが状況を理解しやすい具体的で簡潔なメッセージを設計する（例: 「[質問タイトル] の回答期限が超過しました」、「[ユーザー名] さんが [質問タイトル] に回答しました」）。
*   **パフォーマンス:** 通知件数が増加した場合のデータベースクエリやAPIレスポンスのパフォーマンスに注意する。適切なインデックス作成とページネーションが重要。
*   **重複通知:** 特に期限超過通知において、同じイベントに対して繰り返し通知が生成されないように制御ロジックを実装する。

