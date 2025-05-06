export interface AssignedQuestion {
  id: string;
  title: string;
  project: string;
  deadline: string;
  status: string;
}

export interface CreatedQuestion {
  id: string;
  title: string;
  project: string;
  createdAt: string;
  status: string;
}

export interface RecentProject {
  id: string;
  name: string;
  questionsCount: number;
  answersCount: number;
}

export interface DashboardStats {
  assignedQuestions: number;
  completedQuestions: number;
  nearDeadlineQuestions: number;
  overdueQuestions: number;
}

export interface MockDashboardData {
  stats: DashboardStats;
  assignedQuestions: AssignedQuestion[];
  createdQuestions: CreatedQuestion[];
  recentProjects: RecentProject[];
}

// ダッシュボード用モックデータ
export const mockDashboardData: MockDashboardData = {
  stats: {
    assignedQuestions: 3,
    completedQuestions: 15,
    nearDeadlineQuestions: 2,
    overdueQuestions: 1
  },
  assignedQuestions: [
    {
      id: "q-001",
      title: "TypeScriptの型定義について",
      project: "Next.jsアプリケーション開発",
      deadline: "2024-01-10T23:59:59Z",
      status: "回答中"
    },
    {
      id: "q-003",
      title: "UIデザインガイドラインについて",
      project: "モバイルアプリリニューアル",
      deadline: "2024-01-01T23:59:59Z",
      status: "オープン"
    },
    {
      id: "q-005",
      title: "パフォーマンス最適化について",
      project: "Next.jsアプリケーション開発",
      deadline: "2023-12-25T23:59:59Z",
      status: "オープン"
    }
  ],
  createdQuestions: [
    {
      id: "q-002",
      title: "APIレスポンスのエラーハンドリングについて",
      project: "Next.jsアプリケーション開発",
      createdAt: "2023-12-10T14:00:00Z",
      status: "クローズ"
    },
    {
      id: "q-004",
      title: "データ分析用SQLクエリの最適化",
      project: "データ分析基盤構築",
      createdAt: "2023-12-19T16:45:00Z",
      status: "承認待ち"
    }
  ],
  recentProjects: [
    {
      id: "proj-001",
      name: "Next.jsアプリケーション開発",
      questionsCount: 8,
      answersCount: 12
    },
    {
      id: "proj-002",
      name: "モバイルアプリリニューアル",
      questionsCount: 3,
      answersCount: 4
    },
    {
      id: "proj-003",
      name: "データ分析基盤構築",
      questionsCount: 2,
      answersCount: 1
    }
  ]
}; 