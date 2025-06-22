export interface MockProject {
  id: string;
  name: string;
  description: string;
  members?: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  questions?: Array<{
    id: string;
    title: string;
    status: string;
    createdBy: string;
    createdAt: string;
  }>;
  status: string;
  createdAt: string;
  updatedAt: string;
  members_count?: number;
  questions_count?: number;
  _count?: {
    questions: number;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

// モックプロジェクトデータ
export const mockProjects = [
  {
    id: "proj-001",
    name: "Next.jsアプリケーション開発",
    description: "モダンなフロントエンド技術を活用したWebアプリケーションの開発プロジェクト",
    members: [
      {
        id: "user-001",
        name: "田中太郎",
        role: "プロジェクトマネージャー",
        avatar: "/avatars/user1.png"
      },
      {
        id: "user-002",
        name: "佐藤花子",
        role: "フロントエンドエンジニア",
        avatar: "/avatars/user2.png"
      },
      {
        id: "user-003",
        name: "鈴木一郎",
        role: "バックエンドエンジニア",
        avatar: "/avatars/user3.png"
      }
    ],
    questions: [
      {
        id: "q-001",
        title: "TypeScriptの型定義について",
        status: "オープン",
        createdBy: "user-002",
        createdAt: "2023-12-15T09:30:00Z"
      },
      {
        id: "q-002",
        title: "APIレスポンスのエラーハンドリングについて",
        status: "クローズ",
        createdBy: "user-003",
        createdAt: "2023-12-10T14:00:00Z" 
      }
    ],
    status: "進行中",
    createdAt: "2023-12-01T00:00:00Z",
    updatedAt: "2023-12-20T15:00:00Z",
    members_count: 3,
    questions_count: 2
  },
  {
    id: "proj-002",
    name: "モバイルアプリリニューアル",
    description: "既存のモバイルアプリケーションのリニューアルプロジェクト",
    members: [
      {
        id: "user-001",
        name: "田中太郎",
        role: "プロジェクトマネージャー",
        avatar: "/avatars/user1.png"
      },
      {
        id: "user-004",
        name: "山田健太",
        role: "UIデザイナー",
        avatar: "/avatars/user4.png"
      }
    ],
    questions: [
      {
        id: "q-003",
        title: "UIデザインガイドラインについて",
        status: "オープン",
        createdBy: "user-004",
        createdAt: "2023-12-18T11:15:00Z"
      }
    ],
    status: "計画中",
    createdAt: "2023-12-10T00:00:00Z",
    updatedAt: "2023-12-18T10:00:00Z",
    members_count: 2,
    questions_count: 1
  },
  {
    id: "proj-003",
    name: "データ分析基盤構築",
    description: "ビジネスインテリジェンスのためのデータ分析基盤構築プロジェクト",
    members: [
      {
        id: "user-003",
        name: "鈴木一郎",
        role: "データエンジニア",
        avatar: "/avatars/user3.png"
      },
      {
        id: "user-005",
        name: "高橋真理",
        role: "データサイエンティスト",
        avatar: "/avatars/user5.png"
      }
    ],
    questions: [],
    status: "進行中",
    createdAt: "2023-11-15T00:00:00Z",
    updatedAt: "2023-12-15T09:00:00Z",
    members_count: 2,
    questions_count: 0
  }
]; 