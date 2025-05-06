export interface MockQuestion {
  id: string;
  title: string;
  project: string;
  project_id: string;
  status: string;
  priority: string;
  assignees: Array<{
    id: string;
    name: string;
    avatar: string;
    role?: string;
  }>;
  createdBy: string;
  createdByName: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  tags?: string[];
  answers?: Array<{
    id: string;
    content: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
    isAccepted: boolean;
  }>;
  comments?: Array<{
    id: string;
    content: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    size: string;
    type: string;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
}

// 質問一覧のモックデータ
export const mockQuestions: MockQuestion[] = [
  {
    id: 'q1',
    title: 'ログイン機能の実装について',
    project: 'プロジェクトA',
    project_id: 'proj1',
    status: '回答中',
    priority: '高',
    assignees: [
      { id: 'user1', name: '鈴木 一郎', avatar: '' },
      { id: 'user2', name: '佐藤 二郎', avatar: '' },
    ],
    createdBy: 'user3',
    createdByName: '田中 三郎',
    deadline: '2023-08-15',
    createdAt: '2023-07-25',
    updatedAt: '2023-08-01',
    description: `
# ログイン機能の実装について

現在、ログイン機能の実装を担当しておりますが、以下の点について確認させてください。

## 実装予定の内容
1. メールアドレスとパスワードによる認証
2. ソーシャルログイン（Google、Githubを予定）
3. トークンベースの認証（JWT）

## 質問内容
- トークンの有効期限は何時間が適切でしょうか？
- リフレッシュトークンの実装は必要でしょうか？
- パスワードのハッシュ化には何を使うべきでしょうか？（bcryptを検討中）
- 2要素認証の導入予定はありますか？

よろしくお願いいたします。
  `,
    tags: ['認証', 'セキュリティ', 'API'],
    answers: [
      {
        id: 'a1',
        content: `
# ログイン機能についての回答

ご質問いただきありがとうございます。以下、回答いたします。

## トークンの有効期限
通常、JWTの有効期限は用途によって異なりますが：
- アクセストークン: 15分〜1時間が一般的
- リフレッシュトークン: 1日〜2週間が一般的

ユーザー体験とセキュリティのバランスを考えると、アクセストークンは1時間、リフレッシュトークンは2週間が良いでしょう。

## リフレッシュトークンの実装
はい、実装をお勧めします。短い有効期限のアクセストークンとより長い有効期限のリフレッシュトークンの組み合わせが最も安全です。

## パスワードのハッシュ化
bcryptは良い選択です。以下の理由でお勧めします：
- 意図的に遅い処理速度でブルートフォース攻撃に強い
- ソルトが組み込まれている
- 広く使われており、十分に検証されている

## 2要素認証
セキュリティ要件が高い場合は導入をお勧めします。以下の選択肢があります：
- SMS
- 認証アプリ（Google Authenticatorなど）
- メール

認証アプリが最も安全でおすすめです。

実装についてさらにご質問があればお知らせください。
      `,
        createdBy: 'user1',
        createdByName: '鈴木 一郎',
        createdAt: '2023-07-27',
        updatedAt: '2023-07-27',
        isAccepted: false,
      },
    ],
    comments: [
      {
        id: 'c1',
        content: 'トークンの有効期限については、開発段階では長めに設定しても良いかもしれません。本番環境では短くすることを推奨します。',
        createdBy: 'user2',
        createdByName: '佐藤 二郎',
        createdAt: '2023-07-26',
      },
      {
        id: 'c2',
        content: '2要素認証については、要件定義でオプション機能として検討されていましたが、必須ではありません。まずは基本認証の実装を優先しましょう。',
        createdBy: 'user1',
        createdByName: '鈴木 一郎',
        createdAt: '2023-07-28',
      },
    ],
    attachments: [
      {
        id: 'file1',
        name: '認証フロー図.pdf',
        size: '243 KB',
        type: 'application/pdf',
        url: '#',
        uploadedBy: 'user3',
        uploadedAt: '2023-07-25',
      },
    ],
  },
  {
    id: 'q2',
    title: 'APIのレスポンス形式の統一',
    project: 'プロジェクトA',
    project_id: 'proj1',
    status: '承認待ち',
    priority: '中',
    assignees: [
      { id: 'user3', name: '田中 三郎', avatar: '' },
    ],
    createdBy: 'user2',
    createdByName: '佐藤 二郎',
    deadline: '2023-08-20',
    createdAt: '2023-07-28',
    updatedAt: '2023-07-30',
  },
  {
    id: 'q3',
    title: 'デザインガイドラインの適用方法',
    project: 'プロジェクトB',
    project_id: 'proj2',
    status: 'クローズ',
    priority: '低',
    assignees: [
      { id: 'user4', name: '高橋 四郎', avatar: '' },
    ],
    createdBy: 'user1',
    createdByName: '鈴木 一郎',
    deadline: '2023-07-25',
    createdAt: '2023-07-15',
    updatedAt: '2023-07-23',
  },
  {
    id: 'q4',
    title: 'テストケースの追加について',
    project: 'プロジェクトA',
    project_id: 'proj1',
    status: '回答中',
    priority: '中',
    assignees: [
      { id: 'user5', name: '伊藤 五郎', avatar: '' },
      { id: 'user1', name: '鈴木 一郎', avatar: '' },
    ],
    createdBy: 'user2',
    createdByName: '佐藤 二郎',
    deadline: '2023-08-25',
    createdAt: '2023-08-01',
    updatedAt: '2023-08-02',
  },
  {
    id: 'q5',
    title: 'パフォーマンス最適化の方法',
    project: 'プロジェクトC',
    project_id: 'proj3',
    status: '承認待ち',
    priority: '高',
    assignees: [
      { id: 'user3', name: '田中 三郎', avatar: '' },
      { id: 'user4', name: '高橋 四郎', avatar: '' },
    ],
    createdBy: 'user5',
    createdByName: '伊藤 五郎',
    deadline: '2023-09-01',
    createdAt: '2023-08-05',
    updatedAt: '2023-08-10',
  },
]; 