export enum NotificationType {
  ASSIGNEE_DEADLINE_EXCEEDED = "ASSIGNEE_DEADLINE_EXCEEDED",
  REQUESTER_DEADLINE_EXCEEDED = "REQUESTER_DEADLINE_EXCEEDED",
  NEW_QUESTION_ASSIGNED = "NEW_QUESTION_ASSIGNED",
  NEW_ANSWER_POSTED = "NEW_ANSWER_POSTED",
  ANSWERED_QUESTION_CLOSED = "ANSWERED_QUESTION_CLOSED"
}

export interface MockNotification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

// 日付操作の関数
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const mockNotifications: MockNotification[] = [
  {
    id: "notif-001",
    userId: "user-001",
    type: NotificationType.NEW_QUESTION_ASSIGNED,
    message: "新しい質問「React Hooksの使い方について」が割り当てられました",
    relatedId: "q-001",
    isRead: false,
    createdAt: daysAgo(0) // 今日
  },
  {
    id: "notif-002",
    userId: "user-001",
    type: NotificationType.ASSIGNEE_DEADLINE_EXCEEDED,
    message: "質問「タイプスクリプトの導入方法について」の回答期限が過ぎています",
    relatedId: "q-002",
    isRead: false,
    createdAt: daysAgo(1) // 1日前
  },
  {
    id: "notif-003",
    userId: "user-001",
    type: NotificationType.NEW_ANSWER_POSTED,
    message: "あなたの質問「アプリのパフォーマンス改善方法」に回答がありました",
    relatedId: "q-003",
    isRead: true,
    createdAt: daysAgo(2) // 2日前
  },
  {
    id: "notif-004",
    userId: "user-001",
    type: NotificationType.ANSWERED_QUESTION_CLOSED,
    message: "あなたが回答した質問「CSSレイアウトの問題」がクローズされました",
    relatedId: "q-004",
    isRead: true,
    createdAt: daysAgo(3) // 3日前
  },
  {
    id: "notif-005",
    userId: "user-001",
    type: NotificationType.REQUESTER_DEADLINE_EXCEEDED,
    message: "あなたの質問「サーバーレスアーキテクチャ」の回答期限が過ぎています",
    relatedId: "q-005",
    isRead: false,
    createdAt: daysAgo(0) // 今日
  },
  {
    id: "notif-006",
    userId: "user-001",
    type: NotificationType.NEW_QUESTION_ASSIGNED,
    message: "新しい質問「データベース選定について」が割り当てられました",
    relatedId: "q-006",
    isRead: false,
    createdAt: daysAgo(4) // 4日前
  },
  {
    id: "notif-007",
    userId: "user-001",
    type: NotificationType.NEW_ANSWER_POSTED,
    message: "あなたの質問「UIデザインの改善点」に回答がありました",
    relatedId: "q-007",
    isRead: true,
    createdAt: daysAgo(5) // 5日前
  }
];

// レスポンス形式に整形する関数
export const getNotificationsResponse = (
  page: number = 1, 
  limit: number = 10, 
  unreadOnly: boolean = false
) => {
  let notifications = [...mockNotifications];
  
  // 未読のみフィルタ
  if (unreadOnly) {
    notifications = notifications.filter(n => !n.isRead);
  }
  
  // ページング処理
  const startIdx = (page - 1) * limit;
  const endIdx = startIdx + limit;
  const paginatedNotifications = notifications.slice(startIdx, endIdx);
  
  // 未読数のカウント
  const unreadCount = mockNotifications.filter(n => !n.isRead).length;
  
  return {
    notifications: paginatedNotifications,
    unreadCount,
    total: notifications.length,
    page,
    limit
  };
}; 