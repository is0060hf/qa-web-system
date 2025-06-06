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
*   **多言語対応:** 本システムでは多言語対応は不要とします。日本語のみのサポートとします。

## 3. データモデル

Prismaスキーマで定義された `Notification` モデルを使用します。期限超過通知の重複を防ぐため、`isDeadlineNotified` フラグは `Question` モデルに実装されています。

```prisma
enum NotificationType {
  ASSIGNEE_DEADLINE_EXCEEDED // 回答者: 期限超過
  REQUESTER_DEADLINE_EXCEEDED // 質問者: 期限超過
  NEW_QUESTION_ASSIGNED     // 回答者: 新規割当
  NEW_ANSWER_POSTED         // 質問者: 新規回答
  ANSWERED_QUESTION_CLOSED  // 回答者: 回答済み質問クローズ
}

model Notification {
  id                 String           @id @default(cuid())
  userId             String           // 通知を受け取るユーザーID
  type               NotificationType // 通知の種類
  message            String           // 表示するメッセージ本文
  relatedId          String?          // 関連エンティティID (主にQuestion ID)
  isRead             Boolean          @default(false) // 未読/既読フラグ
  createdAt          DateTime         @default(now())

  user               User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
}

model Question {
  // ... 他のフィールド ...
  isDeadlineNotified Boolean          @default(false) // 期限超過通知が送信されたかどうか
  // ... 他のフィールド ...
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
    *   受信者: 該当質問の担当者 (`assigneeId`)
    *   処理: `Notification` レコードを作成。
*   **期限超過 (`ASSIGNEE_DEADLINE_EXCEEDED`, `REQUESTER_DEADLINE_EXCEEDED`):**
    *   トリガー: 定期実行ジョブ（Cronジョブ）
    *   処理:
        1.  ステータスが `NEW` または `IN_PROGRESS` で、`deadline` が現在時刻を過ぎており、`isDeadlineNotified` が `false` の質問を検索。
        2.  各該当質問について:
            *   回答者 (`assigneeId`) 向けの `ASSIGNEE_DEADLINE_EXCEEDED` 通知を作成。
            *   質問者 (`creatorId`) 向けの `REQUESTER_DEADLINE_EXCEEDED` 通知を作成。
            *   質問の `isDeadlineNotified` を `true` に更新。

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
*   **更新メカニズム:** 現在の実装では、以下の方法で通知を更新:

    1. **React Query Invalidation:** API呼び出しの結果として通知状態が変わる可能性がある場合に使用
       ```javascript
       const queryClient = useQueryClient();
       
       // 質問への回答後など、新しい通知が生成される可能性がある操作の後
       queryClient.invalidateQueries(['notifications', 'count']);
       ```

    2. **ポーリング:** 定期的な更新のバックアップとして
       ```javascript
       const { data: notificationCount } = useQuery(
         ['notifications', 'count'],
         fetchNotificationCount,
         { 
           refetchInterval: 60000, // 1分ごとに更新
           refetchOnWindowFocus: true 
         }
       );
       ```

    **注:** リアルタイム通知のためのServer-Sent Events (SSE)は未実装です。将来的な実装が推奨されます。

## 7. 定期実行ジョブ（期限超過通知）

*   **実装方法:** APIエンドポイント `/api/cron/check-deadlines` として実装され、外部のcronサービスまたはVercel Cron Jobsから定期的に呼び出されます。
    ```javascript
    // pages/api/cron/check-deadlines.js
    export async function POST(req: NextRequest) {
      // APIキーによる認証チェック
      const apiKey = req.headers.get('x-api-key');
      const expectedApiKey = process.env.CRON_API_KEY;

      if (!apiKey || apiKey !== expectedApiKey) {
        return NextResponse.json(
          { error: '認証エラー' },
          { status: 401 }
        );
      }
      
      // 期限超過した質問を検索して通知を生成
      const overdueQuestions = await prisma.question.findMany({
        where: {
          status: { in: ['NEW', 'IN_PROGRESS'] },
          deadline: { lt: new Date() },
          isDeadlineNotified: false
        },
        include: {
          project: {
            select: {
              name: true,
            },
          },
        }
      });
      
      // 各期限切れ質問に対してトランザクションで通知生成と質問更新を実行
      const notificationResults = await Promise.all(
        overdueQuestions.map(async (question) => {
          return prisma.$transaction(async (tx) => {
            // 回答者への通知
            await tx.notification.create({
              data: {
                userId: question.assigneeId,
                type: 'ASSIGNEE_DEADLINE_EXCEEDED',
                message: `質問「${question.title}」の回答期限が過ぎています（プロジェクト: ${question.project.name}）`,
                relatedId: question.id,
              },
            });

            // 質問者への通知
            await tx.notification.create({
              data: {
                userId: question.creatorId,
                type: 'REQUESTER_DEADLINE_EXCEEDED',
                message: `あなたの質問「${question.title}」の回答期限が過ぎました（プロジェクト: ${question.project.name}）`,
                relatedId: question.id,
              },
            });

            // 質問を通知済みに更新
            await tx.question.update({
              where: { id: question.id },
              data: { isDeadlineNotified: true },
            });

            return question.id;
          });
        })
      );
      
      return NextResponse.json({
        message: `${notificationResults.length}件の期限切れ質問に関する通知を生成しました`,
        processed: notificationResults.length,
        questionIds: notificationResults,
      });
    }
    ```
*   **エンドポイント保護:** APIキー（`x-api-key`ヘッダー）による認証で、認証されたcronサービスからの呼び出しのみを許可します。
*   **実行スケジュール:** 外部のcronサービスまたはVercel Cron Jobsで設定します。推奨は毎日0時に実行。
    ```json
    // vercel.json（Vercel Cron Jobs使用時）
    {
      "crons": [
        {
          "path": "/api/cron/check-deadlines",
          "schedule": "0 0 * * *"
        }
      ]
    }
    ```

## 8. 考慮事項

*   **通知メッセージ:** 各通知タイプに応じて、ユーザーが状況を理解しやすい具体的で簡潔なメッセージを設計する（例: 「[質問タイトル] の回答期限が超過しました」、「[ユーザー名] さんが [質問タイトル] に回答しました」）。
*   **パフォーマンス:** 通知件数が増加した場合のデータベースクエリやAPIレスポンスのパフォーマンスに注意する。適切なインデックス作成とページネーションが重要。
*   **重複通知防止:** 期限超過通知は、`Question.isDeadlineNotified` フラグを利用して、同じ質問に対して複数回通知が送信されないように制御します。
*   **リアルタイム通知:** 現在の実装ではポーリングベースの更新のみ。ユーザーエクスペリエンス向上のため、将来的にSSEやWebSocketによるリアルタイム通知の実装を推奨します。

