import { MockUser, mockUsers } from './users';

export interface MockAuthResponse {
  token?: string;
  user?: MockUser;
  error?: string;
  success?: boolean;
  message?: string;
}

// ダミーのトークン
const MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTAwMSIsImVtYWlsIjoidGFuYWthQGV4YW1wbGUuY29tIiwibmFtZSI6IueUsOi+vOWkqumDjiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTcwMTQ5MTk4MiwiZXhwIjoxNzAxNDk1NTgyfQ.RH3l8cRXyJrwLjMqEO0LGNdBYvBYNv3pYo7FLpC-YhE";

// 認証処理：ログイン
export const mockLogin = (email: string, password: string): MockAuthResponse => {
  // メール形式チェック
  if (!email || !email.includes('@')) {
    return { error: 'メールアドレスの形式が正しくありません' };
  }
  
  // パスワードチェック
  if (!password || password.length < 6) {
    return { error: 'パスワードは6文字以上入力してください' };
  }
  
  // ユーザー検索
  const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' };
  }
  
  // 本来はパスワードハッシュの検証が必要だが、モックのためスキップ
  // 全てのユーザーで"password"をパスワードとして受け入れる
  if (password !== 'password') {
    return { error: 'メールアドレスまたはパスワードが正しくありません' };
  }
  
  return {
    token: MOCK_TOKEN,
    user: user
  };
};

// 認証処理：登録
export const mockRegister = (email: string, password: string, name?: string): MockAuthResponse => {
  // メール形式チェック
  if (!email || !email.includes('@')) {
    return { error: 'メールアドレスの形式が正しくありません' };
  }
  
  // パスワードチェック
  if (!password || password.length < 6) {
    return { error: 'パスワードは6文字以上入力してください' };
  }
  
  // 既存ユーザーチェック
  if (mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: 'このメールアドレスは既に登録されています' };
  }
  
  // 新規ユーザー作成（実際には保存しないが、レスポンスを返す）
  const newUser: MockUser = {
    id: `user-${Math.floor(Math.random() * 1000)}`,
    email,
    name: name || email.split('@')[0],
    role: 'USER',
    createdAt: new Date().toISOString()
  };
  
  return {
    token: MOCK_TOKEN,
    user: newUser
  };
};

// パスワードリセット要求
export const mockRequestPasswordReset = (email: string): MockAuthResponse => {
  // メール形式チェック
  if (!email || !email.includes('@')) {
    return { error: 'メールアドレスの形式が正しくありません' };
  }
  
  // ユーザー検索（存在しなくても成功レスポンスを返す - セキュリティのため）
  return {
    success: true,
    message: 'パスワードリセットリンクをメールで送信しました。メールを確認してください。'
  };
};

// パスワードリセット実行
export const mockResetPassword = (token: string, newPassword: string): MockAuthResponse => {
  // トークンチェック
  if (!token || token.length < 10) {
    return { error: '無効なトークンです' };
  }
  
  // パスワードチェック
  if (!newPassword || newPassword.length < 6) {
    return { error: 'パスワードは6文字以上入力してください' };
  }
  
  return {
    success: true,
    message: 'パスワードを更新しました。新しいパスワードでログインしてください。'
  };
}; 