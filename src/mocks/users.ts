export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  projects?: string[];
}

export const mockUsers: MockUser[] = [
  {
    id: "user-001",
    email: "tanaka@example.com",
    name: "田中太郎",
    role: "ADMIN",
    createdAt: "2023-11-01T00:00:00Z",
    projects: ["proj-001", "proj-002"]
  },
  {
    id: "user-002",
    email: "sato@example.com",
    name: "佐藤花子",
    role: "USER",
    createdAt: "2023-11-05T00:00:00Z",
    projects: ["proj-001"]
  },
  {
    id: "user-003",
    email: "suzuki@example.com",
    name: "鈴木一郎",
    role: "USER",
    createdAt: "2023-11-10T00:00:00Z",
    projects: ["proj-001", "proj-003"]
  },
  {
    id: "user-004",
    email: "yamada@example.com",
    name: "山田健太",
    role: "USER",
    createdAt: "2023-11-15T00:00:00Z",
    projects: ["proj-002"]
  },
  {
    id: "user-005",
    email: "takahashi@example.com",
    name: "高橋真理",
    role: "USER",
    createdAt: "2023-11-20T00:00:00Z",
    projects: ["proj-003"]
  }
];

// 認証用ダミーデータ
export const mockMe = mockUsers[0]; // ログインユーザーはAdmin

// ユーザープロジェクト一覧
export const mockUserProjects = [
  {
    id: "proj-001",
    name: "Next.jsアプリケーション開発",
    role: "MANAGER"
  },
  {
    id: "proj-002",
    name: "モバイルアプリリニューアル",
    role: "MANAGER"
  }
]; 