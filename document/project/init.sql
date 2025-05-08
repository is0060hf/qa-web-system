-- パスワード「root123!」のbcryptハッシュ値
-- SALT_ROUNDS = 10で生成

-- Userテーブルへのデータ挿入
INSERT INTO "User" (
  "id",
  "email",
  "passwordHash",
  "name",
  "role",
  "createdAt",
  "updatedAt"
) VALUES
  ('user-001', 'tanaka@example.com', '$2a$10$QBUaUEDrdlTxLgeCyeQXG.7YHDWQGnT1Fj8Jo8wz1URtBSNEuS2fm', '田中太郎', 'ADMIN',  '2023-11-01T00:00:00Z', NOW()),
  ('user-002', 'sato@example.com',   '$2a$10$QBUaUEDrdlTxLgeCyeQXG.7YHDWQGnT1Fj8Jo8wz1URtBSNEuS2fm', '佐藤花子', 'USER',   '2023-11-05T00:00:00Z', NOW()),
  ('user-003', 'suzuki@example.com', '$2a$10$QBUaUEDrdlTxLgeCyeQXG.7YHDWQGnT1Fj8Jo8wz1URtBSNEuS2fm', '鈴木一郎','USER',   '2023-11-10T00:00:00Z', NOW()),
  ('user-004', 'yamada@example.com', '$2a$10$QBUaUEDrdlTxLgeCyeQXG.7YHDWQGnT1Fj8Jo8wz1URtBSNEuS2fm', '山田健太','USER',   '2023-11-15T00:00:00Z', NOW()),
  ('user-005', 'takahashi@example.com','$2a$10$QBUaUEDrdlTxLgeCyeQXG.7YHDWQGnT1Fj8Jo8wz1URtBSNEuS2fm','高橋真理','USER',   '2023-11-20T00:00:00Z', NOW());

-- Projectテーブルへのデータ挿入
INSERT INTO "Project" (
  "id",
  "name",
  "description",
  "creatorId",
  "createdAt",
  "updatedAt"
) VALUES
  ('proj-001', 'Next.jsアプリケーション開発', 'モダンなフロントエンド技術を活用したWebアプリケーションの開発プロジェクト', 'user-001', '2023-12-01T00:00:00Z', '2023-12-20T15:00:00Z'),
  ('proj-002', 'モバイルアプリリニューアル',           '既存のモバイルアプリケーションのリニューアルプロジェクト',                                   'user-001', '2023-12-10T00:00:00Z', '2023-12-18T10:00:00Z'),
  ('proj-003', 'データ分析基盤構築',                   'ビジネスインテリジェンスのためのデータ分析基盤構築プロジェクト',                               'user-003', '2023-11-15T00:00:00Z', '2023-12-15T09:00:00Z');

-- ProjectMemberテーブルへのデータ挿入
INSERT INTO "ProjectMember" (
  "id",
  "projectId",
  "userId",
  "role",
  "joinedAt"
) VALUES
  ('pm-001', 'proj-001', 'user-001', 'MANAGER', NOW()),
  ('pm-002', 'proj-001', 'user-002', 'MEMBER',  NOW()),
  ('pm-003', 'proj-001', 'user-003', 'MEMBER',  NOW()),
  ('pm-004', 'proj-002', 'user-001', 'MANAGER', NOW()),
  ('pm-005', 'proj-002', 'user-004', 'MEMBER',  NOW()),
  ('pm-006', 'proj-003', 'user-003', 'MEMBER',  NOW()),
  ('pm-007', 'proj-003', 'user-005', 'MEMBER',  NOW());

-- ProjectTagテーブルへのデータ挿入
INSERT INTO "ProjectTag" (
  "id",
  "name",
  "projectId",
  "createdAt"
) VALUES
  ('tag-001', '認証',       'proj-001', NOW()),
  ('tag-002', 'セキュリティ','proj-001', NOW()),
  ('tag-003', 'API',         'proj-001', NOW()),
  ('tag-004', 'UI/UX',       'proj-002', NOW()),
  ('tag-005', 'データ分析',   'proj-003', NOW());

-- Questionテーブルへのデータ挿入
INSERT INTO "Question" (
  "id",
  "title",
  "content",
  "status",
  "priority",
  "deadline",
  "projectId",
  "creatorId",
  "assigneeId",
  "isDeadlineNotified",
  "createdAt",
  "updatedAt"
) VALUES
  ('q-001', 'TypeScriptの型定義について',             'TypeScriptの型定義について質問です。具体的な内容は...', 'IN_PROGRESS',       'HIGH',    '2024-01-10T23:59:59Z', 'proj-001', 'user-002', 'user-001', false, '2023-12-15T09:30:00Z', NOW()),
  ('q-002', 'APIレスポンスのエラーハンドリングについて','APIからのレスポンスのエラーハンドリングについて質問です。', 'CLOSED',            'MEDIUM',  '2023-12-20T14:00:00Z', 'proj-001', 'user-003', 'user-001', false, '2023-12-10T14:00:00Z', NOW()),
  ('q-003', 'UIデザインガイドラインについて',        'UIデザインガイドラインについての質問です。',             'NEW',               'LOW',     '2024-01-01T23:59:59Z', 'proj-002', 'user-004', 'user-001', false, '2023-12-18T11:15:00Z', NOW()),
  ('q-004', 'データ分析用SQLクエリの最適化',          'データ分析用SQLクエリの最適化について質問です。',         'PENDING_APPROVAL',  'MEDIUM',  '2023-12-25T16:45:00Z', 'proj-003', 'user-001', 'user-005', false, '2023-12-19T16:45:00Z', NOW()),
  ('q-005', 'パフォーマンス最適化について',          'アプリケーションのパフォーマンス最適化について質問です。','NEW',               'HIGHEST', '2023-12-25T23:59:59Z', 'proj-001', 'user-001', 'user-003', false, '2023-12-20T10:00:00Z', NOW());

-- QuestionTagテーブルへのデータ挿入
INSERT INTO "QuestionTag" (
  "id",
  "questionId",
  "tagId"
) VALUES
  ('qt-001', 'q-001', 'tag-001'),
  ('qt-002', 'q-002', 'tag-003'),
  ('qt-003', 'q-003', 'tag-004'),
  ('qt-004', 'q-004', 'tag-005'),
  ('qt-005', 'q-005', 'tag-003');

-- Answerテーブルへのデータ挿入
INSERT INTO "Answer" (
  "id",
  "content",
  "questionId",
  "creatorId",
  "createdAt",
  "updatedAt"
) VALUES
  ('ans-001', '# 回答\nTypeScriptの型定義については以下のように実装すると良いでしょう...', 'q-001', 'user-001', NOW(), NOW()),
  ('ans-002', '# エラーハンドリングの回答\nAPIのエラーハンドリングは次のパターンを検討してください...', 'q-002', 'user-002', NOW(), NOW()),
  ('ans-003', '# UIデザインガイドライン\nデザインガイドラインは以下のリンクを参照してください...', 'q-003', 'user-001', '2023-12-20T09:15:00Z', '2023-12-20T09:15:00Z');

-- MediaFileテーブルへのデータ挿入
INSERT INTO "MediaFile" (
  "id",
  "fileName",
  "fileType",
  "fileSize",
  "storageUrl",
  "uploaderId",
  "createdAt"
) VALUES
  ('file-001', '認証フロー図.pdf',            'application/pdf', 243000, 'https://example.com/storage/auth-flow.pdf', 'user-001', NOW()),
  ('file-002', 'UI設計書.png',                 'image/png',      156000, 'https://example.com/storage/ui-design.png',    'user-004', NOW()),
  ('file-003', 'パフォーマンス分析.xlsx',       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 125000, 'https://example.com/storage/performance.xlsx','user-003', NOW());

-- AnswerMediaFileテーブルへのデータ挿入
INSERT INTO "AnswerMediaFile" (
  "id",
  "answerId",
  "mediaFileId",
  "createdAt"
) VALUES
  ('amf-001', 'ans-001', 'file-001', NOW()),
  ('amf-002', 'ans-003', 'file-002', NOW());

-- Notificationテーブルへのデータ挿入
INSERT INTO "Notification" (
  "id",
  "userId",
  "type",
  "message",
  "relatedId",
  "isRead",
  "createdAt"
) VALUES
  ('notif-001', 'user-001', 'NEW_QUESTION_ASSIGNED',     '新しい質問「React Hooksの使い方について」が割り当てられました', 'q-001', false, NOW()),
  ('notif-002', 'user-001', 'ASSIGNEE_DEADLINE_EXCEEDED','質問「タイプスクリプトの導入方法について」の回答期限が過ぎています', 'q-002', false, NOW() - INTERVAL '1 DAY'),
  ('notif-003', 'user-001', 'NEW_ANSWER_POSTED',         'あなたの質問「アプリのパフォーマンス改善方法」に回答がありました',    'q-003', true,  NOW() - INTERVAL '2 DAY'),
  ('notif-004', 'user-001', 'ANSWERED_QUESTION_CLOSED',   'あなたが回答した質問「CSSレイアウトの問題」がクローズされました',    'q-004', true,  NOW() - INTERVAL '3 DAY'),
  ('notif-005', 'user-001', 'REQUESTER_DEADLINE_EXCEEDED','あなたの質問「サーバーレスアーキテクチャ」の回答期限が過ぎています',  'q-005', false, NOW()),
  ('notif-006', 'user-002', 'NEW_QUESTION_ASSIGNED',     '新しい質問「データベース選定について」が割り当てられました',         NULL,      false, NOW() - INTERVAL '4 DAY'),
  ('notif-007', 'user-003', 'NEW_ANSWER_POSTED',         'あなたの質問「UIデザインの改善点」に回答がありました',              NULL,      true,  NOW() - INTERVAL '5 DAY');

-- Invitationテーブルへのデータ挿入
INSERT INTO "Invitation" (
  "id",
  "email",
  "projectId",
  "inviterId",
  "status",
  "token",
  "expiresAt",
  "createdAt"
) VALUES
  ('inv-001', 'new-user@example.com',      'proj-001', 'user-001', 'PENDING',  'token-123456789', NOW() + INTERVAL '7 DAY', NOW()),
  ('inv-002', 'another-user@example.com',  'proj-002', 'user-001', 'PENDING',  'token-987654321', NOW() + INTERVAL '7 DAY', NOW()),
  ('inv-003', 'accepted-user@example.com', 'proj-003', 'user-003', 'ACCEPTED','token-accepted123', NOW() - INTERVAL '2 DAY', NOW());