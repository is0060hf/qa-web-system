import React from 'react';

// 直接モックデータファイルを参照せず、型だけをインポート
interface MockQuestion {
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

interface MockProject {
  id: string;
  name: string;
  description: string;
  members?: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
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
}

interface MockDashboardData {
  stats: {
    assignedQuestions: number;
    completedQuestions: number;
    nearDeadlineQuestions: number;
    overdueQuestions: number;
  };
  assignedQuestions: Array<{
    id: string;
    title: string;
    project: string;
    deadline: string;
    status: string;
  }>;
  createdQuestions: Array<{
    id: string;
    title: string;
    project: string;
    createdAt: string;
    status: string;
  }>;
  recentProjects: Array<{
    id: string;
    name: string;
    questionsCount: number;
    answersCount: number;
  }>;
}

// モジュールのデータ型を定義
interface QuestionsModule {
  mockQuestions: MockQuestion[];
}

interface ProjectsModule {
  mockProjects: MockProject[];
}

interface DashboardModule {
  mockDashboardData: MockDashboardData;
}

interface UsersModule {
  mockUsers: any[];
  mockMe: any;
  mockUserProjects: any[];
}

interface NotificationsModule {
  mockNotifications: any[];
  getNotificationsResponse: (page: number, limit: number, unreadOnly: boolean) => any;
  NotificationType: any;
}

interface AuthModule {
  mockLogin: (email: string, password: string) => any;
  mockRegister: (email: string, password: string, name?: string) => any;
  mockRequestPasswordReset: (email: string) => any;
  mockResetPassword: (token: string, newPassword: string) => any;
}

// 実際のデータモジュールを動的にインポート
const getDataModule = async (moduleName: string): Promise<any> => {
  try {
    switch (moduleName) {
      case 'questions':
        return await import('@/mocks/questions') as QuestionsModule;
      case 'projects':
        return await import('@/mocks/projects') as ProjectsModule;
      case 'dashboard':
        return await import('@/mocks/dashboard') as DashboardModule;
      case 'users':
        return await import('@/mocks/users') as UsersModule;
      case 'notifications':
        return await import('@/mocks/notifications') as NotificationsModule;
      case 'auth':
        return await import('@/mocks/auth') as AuthModule;
      default:
        throw new Error(`Unknown module: ${moduleName}`);
    }
  } catch (error) {
    console.error(`Error importing module ${moduleName}:`, error);
    return null;
  }
};

type EndpointType = 'questions' | 'question' | 'projects' | 'project' | 'dashboard' | 'users' | 'auth' | 'notifications' | string;
type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
};

/**
 * データソースの種類を判断する関数
 * NEXT_PUBLIC_DATA_SOURCE=mock の場合はモックデータを使用
 */
const shouldUseMockData = (): boolean => {
  // 環境変数をログ出力（デバッグ用）
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_DATA_SOURCE:', process.env.NEXT_PUBLIC_DATA_SOURCE);
  
  // NEXT_PUBLIC_DATA_SOURCE=mock の場合またはテスト環境の場合はモックデータを使用
  return process.env.NEXT_PUBLIC_DATA_SOURCE === 'mock' || process.env.NODE_ENV === 'test';
};

/**
 * 環境に応じたデータ取得ユーティリティ
 * テスト環境またはデータソース設定がmockの場合はモックデータを、
 * それ以外の環境では実際のAPIを使用
 */
export const fetchData = async <T>(endpoint: EndpointType, options: FetchOptions = {}): Promise<T> => {
  // 環境変数を確認
  if (shouldUseMockData()) {
    return getMockData(endpoint, options) as T;
  }
  
  // 実際のAPIを呼び出す
  const { method = 'GET', body, headers = {}, params = {} } = options;
  
  // クエリパラメータの構築
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const url = `/api/${endpoint}${queryString}`;
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  };
  
  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // 認証エラー（401）の場合、ログインページにリダイレクト
    if (response.status === 401 && typeof window !== 'undefined') {
      // 現在のURLをリダイレクト先として保存（戻れるようにするため）
      const currentPath = window.location.pathname;
      const redirectUrl = `/login?reason=unauthorized&redirect=${encodeURIComponent(currentPath)}`;
      window.location.href = redirectUrl;
    }
    
    throw new Error(
      errorData.error || `API リクエスト失敗: ${response.status} ${response.statusText}`
    );
  }
  
  return response.json();
};

/**
 * モックデータ取得関数
 */
const getMockData = async (endpoint: EndpointType, options: FetchOptions = {}): Promise<unknown> => {
  const { method = 'GET', body, params = {} } = options;
  
  // URLからIDを抽出 (例: 'questions/123' → '123')
  const extractId = (path: string): string | null => {
    const segments = path.split('/');
    return segments.length > 1 ? segments[1] : null;
  };

  // モックデータの取得
  if (endpoint.startsWith('questions')) {
    const questionsModule = await getDataModule('questions') as QuestionsModule;
    if (!questionsModule) return [];
    
    const { mockQuestions } = questionsModule;
    
    const id = extractId(endpoint);
    if (id) {
      // 特定の質問の詳細を返す
      return mockQuestions.find((q: MockQuestion) => q.id === id) || null;
    }
    
    // フィルタリング処理
    let filteredQuestions = [...mockQuestions];
    if (params.status && params.status !== '全て') {
      filteredQuestions = filteredQuestions.filter((q: MockQuestion) => q.status === params.status);
    }
    if (params.project && params.project !== '全て') {
      filteredQuestions = filteredQuestions.filter((q: MockQuestion) => q.project === params.project);
    }
    
    return filteredQuestions;
  }
  
  if (endpoint.startsWith('projects')) {
    const projectsModule = await getDataModule('projects') as ProjectsModule;
    if (!projectsModule) return [];
    
    const { mockProjects } = projectsModule;
    
    const id = extractId(endpoint);
    if (id) {
      // 特定のプロジェクトの詳細を返す
      return mockProjects.find((p: MockProject) => p.id === id) || null;
    }
    
    // フィルタリング処理
    let filteredProjects = [...mockProjects];
    if (params.status && params.status !== '全て') {
      filteredProjects = filteredProjects.filter((p: MockProject) => p.status === params.status);
    }
    
    return filteredProjects;
  }
  
  if (endpoint === 'dashboard') {
    const dashboardModule = await getDataModule('dashboard') as DashboardModule;
    if (!dashboardModule) return {
      stats: { assignedQuestions: 0, completedQuestions: 0, nearDeadlineQuestions: 0, overdueQuestions: 0 },
      assignedQuestions: [],
      createdQuestions: [],
      recentProjects: []
    };
    
    return dashboardModule.mockDashboardData;
  }

  if (endpoint.startsWith('users')) {
    const usersModule = await getDataModule('users') as UsersModule;
    if (!usersModule) return [];
    
    const { mockUsers, mockMe, mockUserProjects } = usersModule;
    
    // 認証中のユーザー情報
    if (endpoint === 'users/me') {
      if (method === 'PATCH' && body) {
        // ユーザー情報更新
        return { ...mockMe, ...body, success: true };
      }
      return mockMe;
    }
    
    // ユーザーのプロジェクト一覧
    if (endpoint === 'users/me/projects') {
      return mockUserProjects;
    }
    
    // ユーザー一覧
    return mockUsers;
  }

  if (endpoint.startsWith('notifications')) {
    const notificationsModule = await getDataModule('notifications') as NotificationsModule;
    if (!notificationsModule) return { notifications: [], unreadCount: 0, total: 0, page: 1, limit: 10 };
    
    const { mockNotifications, getNotificationsResponse } = notificationsModule;
    
    // 通知一覧
    if (endpoint === 'notifications') {
      const page = parseInt(params.page || '1');
      const limit = parseInt(params.limit || '10');
      const unreadOnly = params.unreadOnly === 'true';
      
      return getNotificationsResponse(page, limit, unreadOnly);
    }
    
    // 通知を既読にする
    if (endpoint.match(/notifications\/(.+)\/read/) && method === 'PATCH') {
      const notificationId = endpoint.split('/')[1];
      return { success: true, id: notificationId };
    }
    
    // 全て既読にする
    if (endpoint === 'notifications/read-all' && method === 'POST') {
      return { success: true, updatedCount: mockNotifications.filter(n => !n.isRead).length };
    }
    
    return { notifications: [], unreadCount: 0, total: 0, page: 1, limit: 10 };
  }

  if (endpoint.startsWith('auth')) {
    const authModule = await getDataModule('auth') as AuthModule;
    if (!authModule) return { error: 'Auth module not available' };
    
    const { mockLogin, mockRegister, mockRequestPasswordReset, mockResetPassword } = authModule;
    
    // ログイン
    if (endpoint === 'auth/login' && method === 'POST' && body) {
      return mockLogin(body.email, body.password);
    }
    
    // 登録
    if (endpoint === 'auth/register' && method === 'POST' && body) {
      return mockRegister(body.email, body.password, body.name);
    }
    
    // パスワードリセット要求
    if (endpoint === 'auth/request-password-reset' && method === 'POST' && body) {
      return mockRequestPasswordReset(body.email);
    }
    
    // パスワードリセット実行
    if (endpoint === 'auth/reset-password' && method === 'POST' && body) {
      return mockResetPassword(body.token, body.newPassword);
    }
    
    // ログイン中のユーザー情報
    if (endpoint === 'auth/me') {
      const usersModule = await getDataModule('users') as UsersModule;
      return usersModule?.mockMe || null;
    }
    
    // ログアウト
    if (endpoint === 'auth/logout' && method === 'POST') {
      return { success: true };
    }
    
    return { error: '不明な認証エンドポイント' };
  }
  
  // デフォルトでは空配列を返す
  return [];
};

/**
 * レスポンス待機中に表示するローディング状態管理用フック
 */
export const useDataFetching = <T>(
  fetchFunction: () => Promise<T>,
  initialData: T
): {
  data: T;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} => {
  const [data, setData] = React.useState<T>(initialData);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // fetchFunctionの参照が変わらないようにする
  const stableFetchFunction = React.useCallback(fetchFunction, []);
  
  const fetchData = React.useCallback(async () => {
    // モックデータ使用時は短いローディング表示か直接データ表示
    const isMockMode = shouldUseMockData();
    
    if (!isMockMode) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const result = await stableFetchFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      console.error('データ取得エラー:', err);
    } finally {
      setIsLoading(false);
    }
  }, [stableFetchFunction]);
  
  // 一度だけ実行されるようにする
  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return { data, isLoading, error, refetch: fetchData };
}; 