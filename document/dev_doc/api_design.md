# 質問管理Webシステム APIエンドポイント設計

## 1. 認証 (Auth)

### 1.1. ユーザー登録

*   **Method:** `POST`
*   **Path:** `/api/auth/register`
*   **Description:** 新規ユーザーアカウントを作成します。
*   **Authentication:** Public
*   **Authorization:** N/A
*   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "yourpassword",
      "name": "Optional User Name"
    }
    ```
*   **Success Response:** `201 Created`
    ```json
    {
      "id": "user_cuid",
      "email": "user@example.com",
      "name": "Optional User Name",
      "role": "USER",
      "createdAt": "timestamp"
    }
    ```
*   **Error Response:** `400 Bad Request` (入力不備、メールアドレス重複), `500 Internal Server Error`

### 1.2. ログイン

*   **Method:** `POST`
*   **Path:** `/api/auth/login`
*   **Description:** ユーザーを認証し、JWTトークンを発行します。
*   **Authentication:** Public
*   **Authorization:** N/A
*   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "yourpassword"
    }
    ```
*   **Success Response:** `200 OK`
    ```json
    {
      "token": "jwt_token",
      "user": {
        "id": "user_cuid",
        "email": "user@example.com",
        "name": "User Name",
        "role": "USER" // or ADMIN
      }
    }
    ```
*   **Error Response:** `400 Bad Request` (入力不備), `401 Unauthorized` (認証失敗), `500 Internal Server Error`

### 1.3. ログアウト

*   **Method:** `POST`
*   **Path:** `/api/auth/logout`
*   **Description:** クライアントサイドでトークンを削除してログアウトします。（サーバーサイドの処理は特に行わない）
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **Success Response:** `200 OK`
*   **Error Response:** `401 Unauthorized`, `500 Internal Server Error`

### 1.4. パスワードリセット要求

*   **Method:** `POST`
*   **Path:** `/api/auth/request-password-reset`
*   **Description:** パスワードリセット用のメールを送信します。
*   **Authentication:** Public
*   **Authorization:** N/A
*   **Request Body:**
    ```json
    {
      "email": "user@example.com"
    }
    ```
*   **Success Response:** `200 OK` (メール送信成功を通知。ユーザーが存在しない場合も成功として返すのが一般的)
*   **Error Response:** `400 Bad Request`, `500 Internal Server Error`

### 1.5. パスワードリセット実行

*   **Method:** `POST`
*   **Path:** `/api/auth/reset-password`
*   **Description:** 提供されたトークンを使用してパスワードをリセットします。
*   **Authentication:** Public (Token in body/query)
*   **Authorization:** N/A
*   **Request Body:**
    ```json
    {
      "token": "reset_token",
      "newPassword": "newSecurePassword"
    }
    ```
*   **Success Response:** `200 OK`
*   **Error Response:** `400 Bad Request` (トークン無効、パスワード要件不足), `500 Internal Server Error`

### 1.6. 現在のユーザー情報取得

*   **Method:** `GET`
*   **Path:** `/api/auth/me`
*   **Description:** 現在認証されているユーザーの情報を取得します。トークンがない場合はnullを返します。
*   **Authentication:** Optional (JWT)
*   **Authorization:** Authenticated User
*   **Success Response:** `200 OK`
    ```json
    {
      "id": "user_cuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "USER" // or ADMIN
    }
    ```
*   **Error Response:** `200 OK` with `null` (トークンなし、または無効な場合)

## 2. ユーザー (Users)

### 2.1. ユーザー一覧取得 (Admin)

*   **Method:** `GET`
*   **Path:** `/api/users`
*   **Description:** 全てのユーザーのリストを取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** ADMIN
*   **Query Parameters:** `?search=...`, `?page=1`, `?limit=20`
*   **Success Response:** `200 OK`
    ```json
    {
      "users": [ { "id": "...", "email": "...", "name": "...", "role": "..." } ],
      "total": 100,
      "page": 1,
      "limit": 20
    }
    ```
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`

### 2.2. ユーザー情報更新 (Admin/Self)

*   **Method:** `PATCH`
*   **Path:** `/api/users/{userId}`
*   **Description:** ユーザー情報を更新します。Adminは任意のユーザー、通常ユーザーは自身の情報のみ更新可能。
*   **Authentication:** Required (JWT)
*   **Authorization:** ADMIN or Self
*   **URL Parameters:** `userId`
*   **Request Body:** (更新したいフィールドのみ)
    ```json
    {
      "name": "Updated Name",
      "role": "ADMIN" // Only by Admin
    }
    ```
*   **Success Response:** `200 OK` (更新後のユーザー情報)
*   **Error Response:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 2.3. ユーザー削除 (Admin)

*   **Method:** `DELETE`
*   **Path:** `/api/users/{userId}`
*   **Description:** ユーザーアカウントを削除します。
*   **Authentication:** Required (JWT)
*   **Authorization:** ADMIN
*   **URL Parameters:** `userId`
*   **Success Response:** `204 No Content`
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## 3. プロジェクト (Projects)

### 3.1. プロジェクト作成

*   **Method:** `POST`
*   **Path:** `/api/projects`
*   **Description:** 新しいプロジェクトを作成します。作成者は自動的にプロジェクト管理者になります。
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **Request Body:**
    ```json
    {
      "name": "New Project Name",
      "description": "Optional project description"
    }
    ```
*   **Success Response:** `201 Created` (作成されたプロジェクト情報)
*   **Error Response:** `400 Bad Request`, `401 Unauthorized`

### 3.2. プロジェクト一覧取得

*   **Method:** `GET`
*   **Path:** `/api/projects`
*   **Description:** ユーザーが参加または管理しているプロジェクトの一覧を取得します。Adminは全てのプロジェクトを取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **Query Parameters:** `?search=...`, `?page=1`, `?limit=20`
*   **Success Response:** `200 OK` (プロジェクトリストとページネーション情報)
*   **Error Response:** `401 Unauthorized`

### 3.3. プロジェクト詳細取得

*   **Method:** `GET`
*   **Path:** `/api/projects/{projectId}`
*   **Description:** 特定のプロジェクトの詳細情報を取得します。メンバー情報には各ユーザーのID、名前、メールアドレス、役割などが含まれます。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Member, Project Manager, ADMIN
*   **URL Parameters:** `projectId`
*   **Success Response:** `200 OK` (プロジェクト詳細情報、メンバー、タグなどを含む)
    ```json
    {
      "id": "project_id",
      "name": "プロジェクト名",
      "description": "プロジェクト説明",
      "createdAt": "creation_timestamp",
      "updatedAt": "update_timestamp",
      "status": "アクティブ",
      "members": [
        {
          "id": "member_id",
          "userId": "user_id",
          "userName": "ユーザー名",
          "userEmail": "user@example.com",
          "role": "MANAGER",
          "joinedAt": "join_timestamp"
        }
      ],
      "questions": [
        {
          "id": "question_id",
          "title": "質問タイトル",
          "status": "NEW",
          "creatorId": "creator_id",
          "createdAt": "creation_timestamp"
        }
      ],
      "tags": [
        {
          "id": "tag_id",
          "name": "タグ名"
        }
      ]
    }
    ```
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 3.3.1. プロジェクト招待可能ユーザー一覧取得

*   **Method:** `GET`
*   **Path:** `/api/projects/{projectId}/available-users`
*   **Description:** 特定のプロジェクトに招待可能なユーザー（まだメンバーでないユーザー）の一覧を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Member, Project Manager, ADMIN
*   **URL Parameters:** `projectId`
*   **Success Response:** `200 OK` (ユーザー一覧)
    ```json
    [
      { "id": "user_cuid", "name": "User Name", "email": "user@example.com" },
      ...
    ]
    ```
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 3.4. プロジェクト情報更新

*   **Method:** `PATCH`
*   **Path:** `/api/projects/{projectId}`
*   **Description:** プロジェクト名や説明を更新します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Manager, ADMIN
*   **URL Parameters:** `projectId`
*   **Request Body:** (更新したいフィールドのみ)
    ```json
    {
      "name": "Updated Project Name",
      "description": "Updated description"
    }
    ```
*   **Success Response:** `200 OK` (更新後のプロジェクト情報)
*   **Error Response:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 3.5. プロジェクト削除

*   **Method:** `DELETE`
*   **Path:** `/api/projects/{projectId}`
*   **Description:** プロジェクトを削除します。
*   **Authentication:** Required (JWT)
*   **Authorization:** ADMIN (またはプロジェクト作成者のみに限定する可能性あり)
*   **URL Parameters:** `projectId`
*   **Success Response:** `204 No Content`
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## 4. プロジェクトメンバー (Project Members)

### 4.1. プロジェクトメンバー一覧取得

*   **Method:** `GET`
*   **Path:** `/api/projects/{projectId}/members`
*   **Description:** プロジェクトに参加しているメンバーの一覧を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Member, Project Manager, ADMIN
*   **URL Parameters:** `projectId`
*   **Success Response:** `200 OK` (メンバーリスト)
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 4.2. プロジェクトメンバー役割変更

*   **Method:** `PATCH`
*   **Path:** `/api/projects/{projectId}/members/{memberId}`
*   **Description:** プロジェクトメンバーの役割（Manager/Member）を変更します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Manager, ADMIN
*   **URL Parameters:** `projectId`, `memberId` (ProjectMember ID)
*   **Request Body:**
    ```json
    {
      "role": "MANAGER" // or "MEMBER"
    }
    ```
*   **Success Response:** `200 OK` (更新後のメンバー情報)
*   **Error Response:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 4.3. プロジェクトメンバー除外

*   **Method:** `DELETE`
*   **Path:** `/api/projects/{projectId}/members/{memberId}`
*   **Description:** プロジェクトからメンバーを除外します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Manager, ADMIN
*   **URL Parameters:** `projectId`, `memberId` (ProjectMember ID)
*   **Success Response:** `204 No Content`
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## 5. プロジェクトタグ (Project Tags)

### 5.1. プロジェクトタグ作成

*   **Method:** `POST`
*   **Path:** `/api/projects/{projectId}/tags`
*   **Description:** プロジェクトに新しいタグを作成します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Manager, ADMIN
*   **URL Parameters:** `projectId`
*   **Request Body:**
    ```json
    {
      "name": "TagName"
    }
    ```
*   **Success Response:** `201 Created` (作成されたタグ情報)
*   **Error Response:** `400 Bad Request` (タグ名重複), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 5.2. プロジェクトタグ一覧取得

*   **Method:** `GET`
*   **Path:** `/api/projects/{projectId}/tags`
*   **Description:** プロジェクトに設定されているタグの一覧を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Member, Project Manager, ADMIN
*   **URL Parameters:** `projectId`
*   **Success Response:** `200 OK` (タグリスト)
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 5.3. プロジェクトタグ更新

*   **Method:** `PATCH`
*   **Path:** `/api/projects/{projectId}/tags/{tagId}`
*   **Description:** プロジェクトタグの名前を更新します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Manager, ADMIN
*   **URL Parameters:** `projectId`, `tagId`
*   **Request Body:**
    ```json
    {
      "name": "UpdatedTagName"
    }
    ```
*   **Success Response:** `200 OK` (更新後のタグ情報)
*   **Error Response:** `400 Bad Request` (タグ名重複), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 5.4. プロジェクトタグ削除

*   **Method:** `DELETE`
*   **Path:** `/api/projects/{projectId}/tags/{tagId}`
*   **Description:** プロジェクトタグを削除します。関連する質問タグも削除されます。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Manager, ADMIN
*   **URL Parameters:** `projectId`, `tagId`
*   **Success Response:** `204 No Content`
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## 6. 招待 (Invitations)

### 6.1. プロジェクトへのユーザー招待

*   **Method:** `POST`
*   **Path:** `/api/projects/{projectId}/invitations`
*   **Description:** ユーザーをプロジェクトに招待します（既存ユーザー選択またはメールアドレス指定）。既存ユーザーを招待した場合は自動的にプロジェクトメンバーとして追加され、招待ステータスは「ACCEPTED」に設定されます。メールアドレスのみの招待の場合は、招待レコードを作成し、ステータスは「PENDING」となります。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Manager, ADMIN
*   **URL Parameters:** `projectId`
*   **Request Body:**
    ```json
    // 既存ユーザーを招待（即時メンバー追加）
    { 
      "type": "userId",
      "userId": "existing_user_cuid" 
    }
    // メールアドレスで招待
    { 
      "type": "email",
      "email": "newuser@example.com" 
    }
    ```
*   **Success Response:** `201 Created` 
    ```json
    // 既存ユーザー招待時
    {
      "message": "ユーザーをプロジェクトに追加しました",
      "invitation": { ... },
      "memberRecord": { ... }
    }
    
    // メールアドレス招待時
    {
      "message": "プロジェクト招待を送信しました",
      "invitation": { ... }
    }
    ```
*   **Error Response:** `400 Bad Request` (ユーザー既に参加済み、招待済み、メール形式不正), `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Project or User not found)

### 6.2. 招待承認/拒否

*   **Method:** `POST`
*   **Path:** `/api/invitations/respond`
*   **Description:** 招待されたユーザーが招待を承認または拒否します。承認した場合はプロジェクトメンバーとして追加されます。
*   **Authentication:** Required (JWT) - 招待されたユーザーとしてログインしている必要があります
*   **Request Body:**
    ```json
    {
      "token": "invitation_token",
      "accept": true // true: 承認、false: 拒否
    }
    ```
*   **Success Response:** 
    ```json
    // 承認時
    {
      "message": "プロジェクト招待を承認しました",
      "project": { ... },
      "membership": { ... }
    }
    
    // 拒否時
    {
      "message": "プロジェクト招待を拒否しました"
    }
    ```
*   **Error Response:** `400 Bad Request` (トークン無効/期限切れ), `401 Unauthorized`, `403 Forbidden` (招待メールアドレスとユーザーのメールアドレス不一致), `404 Not Found` (Invitation not found), `410 Gone` (既に応答済みの招待/期限切れ)

### 6.3. トークンによる招待詳細取得

*   **Method:** `GET`
*   **Path:** `/api/invitations/{token}`
*   **Description:** 招待トークンに基づいて招待の詳細情報を取得します。
*   **Authentication:** Optional - 未認証でもアクセス可能ですが、認証済みの場合はユーザーと招待の関連チェックを行います
*   **URL Parameters:** `token` (招待トークン)
*   **Success Response:** `200 OK` (招待詳細情報)
    ```json
    {
      "invitation": {
        "id": "invitation_id",
        "email": "invited@example.com",
        "status": "PENDING",
        "expiresAt": "expiry_timestamp",
        "createdAt": "creation_timestamp",
        "project": {
          "id": "project_id",
          "name": "Project Name",
          "description": "Project Description"
        },
        "inviter": {
          "id": "inviter_id",
          "name": "Inviter Name",
          "email": "inviter@example.com"
        }
      }
    }
    ```
*   **Error Response:** `404 Not Found` (招待が見つからない), `410 Gone` (招待が期限切れまたは既に応答済み)

### 6.4. 保留中の招待一覧 (プロジェクト別)

*   **Method:** `GET`
*   **Path:** `/api/projects/{projectId}/invitations`
*   **Description:** 特定のプロジェクトで保留中の招待一覧を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Manager, ADMIN
*   **URL Parameters:** `projectId`
*   **Query Parameters:** `?status=PENDING`
*   **Success Response:** `200 OK` (招待リスト)
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 6.5. 招待取り消し

*   **Method:** `DELETE`
*   **Path:** `/api/invitations/{invitationId}`
*   **Description:** 送信した招待を取り消します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Manager (who invited), ADMIN
*   **URL Parameters:** `invitationId`
*   **Success Response:** `204 No Content`
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## 7. 質問 (Questions)

### 7.1. 質問作成

*   **Method:** `POST`
*   **Path:** `/api/projects/{projectId}/questions`
*   **Description:** プロジェクト内に新しい質問を作成します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Member, Project Manager, ADMIN
*   **URL Parameters:** `projectId`
*   **Request Body:**
    ```json
    {
      "title": "Question Title",
      "content": "Detailed question content",
      "assigneeId": "responder_user_cuid",
      "deadline": "iso_timestamp_or_null",
      "priority": "MEDIUM", // HIGHEST, HIGH, MEDIUM, LOW
      "tagIds": ["tag_cuid_1", "tag_cuid_2"],
      "answerForm": { // Optional: Define custom form
        "fields": [
          { "label": "Field 1", "fieldType": "TEXT", "isRequired": true, "order": 1 },
          { "label": "Field 2", "fieldType": "RADIO", "options": ["A", "B"], "isRequired": false, "order": 2 }
        ]
      },
      "answerFormTemplateId": "template_cuid" // Optional: Use template instead of defining form
    }
    ```
*   **Success Response:** `201 Created` (作成された質問情報)
*   **Error Response:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Project, Assignee, Tags not found)

### 7.2. 質問一覧取得 (プロジェクト別)

*   **Method:** `GET`
*   **Path:** `/api/projects/{projectId}/questions`
*   **Description:** 特定のプロジェクト内の質問一覧を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Member, Project Manager, ADMIN
*   **URL Parameters:** `projectId`
*   **Query Parameters:** `?search=...`, `?assigneeId=...`, `?creatorId=...`, `?status=...`, `?priority=...`, `?isDeadlineExpired=true`, `?tagId=...`, `?page=1`, `?limit=20`, `?sortBy=createdAt`, `?sortOrder=desc`
*   **Success Response:** `200 OK` (質問リストとページネーション情報)
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 7.3. 要回答質問一覧取得 (担当者向け)

*   **Method:** `GET`
*   **Path:** `/api/questions/assigned-to-me`
*   **Description:** 現在のユーザーに割り当てられている未完了の質問一覧を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **Query Parameters:** `?search=...`, `?status=NEW,IN_PROGRESS,PENDING_APPROVAL`, `?isDeadlineExpired=true`, `?projectId=...`, `?page=1`, `?limit=20`, `?sortBy=deadline`, `?sortOrder=asc`
*   **Success Response:** `200 OK` (質問リストとページネーション情報)
*   **Error Response:** `401 Unauthorized`

### 7.4. 質問詳細取得

*   **Method:** `GET`
*   **Path:** `/api/questions/{questionId}`
*   **Description:** 特定の質問の詳細情報（回答スレッド、フォーム含む）を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Member (if in same project), Question Creator, Assignee, Project Manager, ADMIN
*   **URL Parameters:** `questionId`
*   **Success Response:** `200 OK` (質問詳細情報)
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 7.5. 質問情報更新

*   **Method:** `PATCH`
*   **Path:** `/api/questions/{questionId}`
*   **Description:** 質問の内容、担当者、期限、優先度、タグなどを更新します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Question Creator, Project Manager, ADMIN (ステータスがCLOSED以外)
*   **URL Parameters:** `questionId`
*   **Request Body:** (更新したいフィールドのみ)
    ```json
    {
      "title": "Updated Title",
      "assigneeId": "new_responder_cuid",
      "priority": "HIGH",
      "tagIds": ["tag_cuid_1", "tag_cuid_3"]
    }
    ```
*   **Success Response:** `200 OK` (更新後の質問情報)
*   **Error Response:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 7.6. 質問ステータス更新 (クローズ/再開)

*   **Method:** `PATCH`
*   **Path:** `/api/questions/{questionId}/status`
*   **Description:** 質問のステータスを変更します（主に承認→クローズ、クローズ→回答中）。
*   **Authentication:** Required (JWT)
*   **Authorization:** Question Creator (for closing), Project Manager, ADMIN
*   **URL Parameters:** `questionId`
*   **Request Body:**
    ```json
    {
      "status": "CLOSED" // or "IN_PROGRESS" for reopening
    }
    ```
*   **Success Response:** `200 OK` (更新後の質問情報)
*   **Error Response:** `400 Bad Request` (不正なステータス遷移), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 7.7. 質問削除

*   **Method:** `DELETE`
*   **Path:** `/api/questions/{questionId}`
*   **Description:** 質問を削除します。ステータスにかかわらず、質問者本人またはAdmin権限を持つユーザーかその質問が属するプロジェクトのプロジェクト管理者のみが削除可能です。
*   **Authentication:** Required (JWT)
*   **Authorization:** Question Creator, Project Manager, ADMIN
*   **URL Parameters:** `questionId`
*   **Success Response:** `204 No Content`
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 7.8. 回答から新規質問作成

*   **Method:** `POST`
*   **Path:** `/api/questions/{questionId}/answers/{answerId}/create-question`
*   **Description:** 特定の回答の内容を引用して、新しい質問を作成します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Member, Project Manager, ADMIN
*   **URL Parameters:** `questionId`, `answerId`
*   **Request Body:**
    ```json
    {
      "title": "New Question Title",
      "content": "Optional additional content",
      "assigneeId": "responder_user_cuid",
      "deadline": "iso_timestamp_or_null",
      "priority": "MEDIUM", // HIGHEST, HIGH, MEDIUM, LOW
      "tagIds": ["tag_cuid_1", "tag_cuid_2"],
      "projectId": "project_cuid", // Optional, defaults to original question's project
      "includeOriginalContent": true // Whether to include the original answer content in the new question
    }
    ```
*   **Success Response:** `201 Created` (作成された質問情報)
*   **Error Response:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Question, Answer, Project, Assignee, Tags not found)

## 8. 回答 (Answers)

### 8.1. 回答投稿

*   **Method:** `POST`
*   **Path:** `/api/questions/{questionId}/answers`
*   **Description:** 質問に対して新しい回答を投稿します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Assigned Responder, Project Manager, ADMIN
*   **URL Parameters:** `questionId`
*   **Request Body:** (Content-Type: multipart/form-data for file uploads)
    ```json
    // For free text
    { "content": "This is the answer." }

    // For form data (sent as form fields, files separate)
    {
      "formData": [
        { "formFieldId": "field1_cuid", "value": "Text value" },
        { "formFieldId": "field2_cuid", "value": "OptionA" }, // Radio value
        { "formFieldId": "field3_cuid", "file": "uploaded_file_reference" } // File handled separately
      ],
      "content": "Optional additional comments"
    }
    // Files are uploaded as part of the multipart request
    ```
*   **Success Response:** `201 Created` (作成された回答情報、添付ファイル情報含む)
*   **Error Response:** `400 Bad Request` (フォーム入力不備), `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Question not found), `413 Payload Too Large` (ファイルサイズ超過)

### 8.2. 回答一覧取得 (質問別)

*   **Method:** `GET`
*   **Path:** `/api/questions/{questionId}/answers`
*   **Description:** 特定の質問に対する回答スレッド（履歴）を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Project Member (if in same project), Question Creator, Assignee, Project Manager, ADMIN
*   **URL Parameters:** `questionId`
*   **Query Parameters:** `?page=1`, `?limit=10`, `?sortOrder=asc` (for chronological order)
*   **Success Response:** `200 OK` (回答リストとページネーション情報)
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 8.3. 回答更新

*   **Method:** `PATCH`
*   **Path:** `/api/answers/{answerId}`
*   **Description:** 自身が投稿した回答の内容を更新します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Answer Creator (if question is not closed)
*   **URL Parameters:** `answerId`
*   **Request Body:** (更新したいフィールドのみ)
    ```json
    { "content": "Updated answer content." }
    // Updating form data might be complex, potentially replace all
    ```
*   **Success Response:** `200 OK` (更新後の回答情報)
*   **Error Response:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` (Not creator or question closed), `404 Not Found`

### 8.4. 回答削除

*   **Method:** `DELETE`
*   **Path:** `/api/answers/{answerId}`
*   **Description:** 自身が投稿した回答を削除します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Answer Creator (if question is not closed)
*   **URL Parameters:** `answerId`
*   **Success Response:** `204 No Content`*   **Error Response:** `401 Unauthorized`, `403 Forbidden` (Not creator or question closed), `404 Not Found`

## 9. メディアファイル (Media)

### 9.1. メディアファイルアップロード

*   **Method:** `POST`
*   **Path:** `/api/media`
*   **Description:** メディアファイルをアップロードします。
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **Request Body:** (multipart/form-data)
    ```
    file: [binary file data]
    ```
*   **Success Response:** `201 Created`
    ```json
    {
      "id": "media_file_cuid",
      "fileName": "image.png",
      "fileType": "image/png",
      "fileSize": 102400,
      "storageUrl": "https://blob-url...",
      "uploaderId": "user_cuid",
      "createdAt": "timestamp"
    }
    ```
*   **Error Response:** `400 Bad Request` (ファイルなし、ファイルサイズ超過), `401 Unauthorized`, `413 Payload Too Large`

### 9.2. メディアファイル取得

*   **Method:** `GET`
*   **Path:** `/api/media/{fileId}`
*   **Description:** メディアファイル情報を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **URL Parameters:** `fileId`
*   **Success Response:** `200 OK` (メディアファイル情報)
*   **Error Response:** `401 Unauthorized`, `404 Not Found`

### 9.3. メディアアップロードURL生成

*   **Method:** `POST`
*   **Path:** `/api/media/upload-url`
*   **Description:** Vercel Blobへの直接アップロード用の署名付きURLを生成します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **Request Body:**
    ```json
    {
      "fileName": "video.mp4",
      "contentType": "video/mp4"
    }
    ```
*   **Success Response:** `200 OK`
    ```json
    {
      "uploadUrl": "https://signed-upload-url...",
      "fileId": "temp_file_id"
    }
    ```
*   **Error Response:** `400 Bad Request`, `401 Unauthorized`

## 10. 回答フォームテンプレート (Answer Form Templates)

### 10.1. テンプレート作成

*   **Method:** `POST`
*   **Path:** `/api/answer-form-templates`
*   **Description:** 新しい回答フォームテンプレートを作成します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **Request Body:**
    ```json
    {
      "name": "Template Name",
      "description": "Optional description",
      "fields": [
        { "label": "Field 1", "fieldType": "TEXT", "isRequired": true, "order": 1 },
        { "label": "Field 2", "fieldType": "NUMBER", "isRequired": false, "order": 2 }
      ]
    }
    ```
*   **Success Response:** `201 Created` (作成されたテンプレート情報)
*   **Error Response:** `400 Bad Request`, `401 Unauthorized`

### 10.2. テンプレート一覧取得

*   **Method:** `GET`
*   **Path:** `/api/answer-form-templates`
*   **Description:** 自身が作成した回答フォームテンプレートの一覧を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **Query Parameters:** `?search=...`
*   **Success Response:** `200 OK` (テンプレートリスト)
*   **Error Response:** `401 Unauthorized`

### 10.3. テンプレート詳細取得

*   **Method:** `GET`
*   **Path:** `/api/answer-form-templates/{templateId}`
*   **Description:** 特定のテンプレートの詳細を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Template Creator
*   **URL Parameters:** `templateId`
*   **Success Response:** `200 OK` (テンプレート詳細)
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 10.4. テンプレート更新

*   **Method:** `PATCH`
*   **Path:** `/api/answer-form-templates/{templateId}`
*   **Description:** テンプレートの内容を更新します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Template Creator
*   **URL Parameters:** `templateId`
*   **Request Body:** (更新したいフィールドのみ)
    ```json
    {
      "name": "Updated Template Name",
      "fields": [ ... ] // Complete updated fields array
    }
    ```
*   **Success Response:** `200 OK` (更新後のテンプレート情報)
*   **Error Response:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 10.5. テンプレート削除

*   **Method:** `DELETE`
*   **Path:** `/api/answer-form-templates/{templateId}`
*   **Description:** テンプレートを削除します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Template Creator
*   **URL Parameters:** `templateId`
*   **Success Response:** `204 No Content`
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## 11. 通知 (Notifications)

### 11.1. 通知一覧取得

*   **Method:** `GET`
*   **Path:** `/api/notifications`
*   **Description:** 現在のユーザー向けの通知一覧を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **Query Parameters:** `?unreadOnly=true`, `?page=1`, `?limit=5` (for dropdown) or `?limit=20` (for list page)
*   **Success Response:** `200 OK`
    ```json
    {
      "notifications": [
        { "id": "...", "type": "...", "message": "...", "relatedId": "...", "isRead": false, "createdAt": "..." }
      ],
      "unreadCount": 5,
      "total": 50,
      "page": 1,
      "limit": 20
    }
    ```
*   **Error Response:** `401 Unauthorized`

### 11.2. 通知を既読にする

*   **Method:** `PATCH`
*   **Path:** `/api/notifications/{notificationId}/read`
*   **Description:** 特定の通知を既読状態にします。
*   **Authentication:** Required (JWT)
*   **Authorization:** Notification Recipient
*   **URL Parameters:** `notificationId`
*   **Success Response:** `200 OK` (更新後の通知情報)
*   **Error Response:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 11.3. 全ての通知を既読にする

*   **Method:** `POST`
*   **Path:** `/api/notifications/read-all`
*   **Description:** 現在のユーザーの全ての未読通知を既読にします。
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **Success Response:** `200 OK` `{ "updatedCount": 10 }`
*   **Error Response:** `401 Unauthorized`

## 12. Cronジョブ (Cron Jobs)

### 12.1. 期限超過チェック

*   **Method:** `POST`
*   **Path:** `/api/cron/check-deadlines`
*   **Description:** 期限切れの質問を検出し、通知を生成します。
*   **Authentication:** API Key (x-api-key header)
*   **Authorization:** Cron Service Only
*   **Headers:** `x-api-key: CRON_API_KEY`
*   **Success Response:** `200 OK`
    ```json
    {
      "message": "N件の期限切れ質問に関する通知を生成しました",
      "processed": 10,
      "questionIds": ["question_id_1", "question_id_2", ...]
    }
    ```
*   **Error Response:** `401 Unauthorized` (APIキー不正), `500 Internal Server Error`

## 13. ダッシュボード (Dashboard)

### 13.1. ダッシュボード統計情報取得

*   **Method:** `GET`
*   **Path:** `/api/dashboard`
*   **Description:** ユーザーのダッシュボード用の統計情報を取得します。
*   **Authentication:** Required (JWT)
*   **Authorization:** Authenticated User
*   **Success Response:** `200 OK`
    ```json
    {
      "projectCount": 5,
      "questionCount": 20,
      "pendingQuestionCount": 3,
      "overdueQuestionCount": 1
    }
    ```
*   **Error Response:** `401 Unauthorized`



