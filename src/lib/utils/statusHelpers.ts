import { QuestionStatus, QuestionPriority } from '@prisma/client';

// ステータスの日本語ラベル
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'NEW':
      return '新規';
    case 'IN_PROGRESS':
      return '回答中';
    case 'PENDING_APPROVAL':
      return '確認待ち';
    case 'CLOSED':
      return '完了';
    default:
      return status;
  }
};

// 優先度の日本語ラベル
export const getPriorityLabel = (priority: string): string => {
  switch (priority) {
    case 'HIGHEST':
      return '最高';
    case 'HIGH':
      return '高';
    case 'MEDIUM':
      return '中';
    case 'LOW':
      return '低';
    default:
      return priority;
  }
};

// 質問の緊急度を計算（期限切れ、未回答、未確認を考慮）
export interface QuestionUrgency {
  level: 'critical' | 'high' | 'medium' | 'low';
  reasons: string[];
}

export const calculateQuestionUrgency = (
  status: QuestionStatus,
  priority: QuestionPriority,
  deadline: Date | null,
  hasAnswers: boolean
): QuestionUrgency => {
  const reasons: string[] = [];
  let level: 'critical' | 'high' | 'medium' | 'low' = 'low';
  const now = new Date();

  // 期限切れチェック
  const isOverdue = deadline && deadline < now;
  
  // 期限切れで未回答の場合
  if (isOverdue && status === 'NEW' && !hasAnswers) {
    reasons.push('期限切れ・未回答');
    level = 'critical';
  }
  // 期限切れで確認待ちの場合
  else if (isOverdue && status === 'PENDING_APPROVAL') {
    reasons.push('期限切れ・確認待ち');
    level = 'high';
  }
  // 期限が近い（3日以内）場合
  else if (deadline) {
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) {
      reasons.push(`期限まで${daysUntilDeadline}日`);
      // この時点でlevelは'low'のはずなので、'high'に上げる
      level = 'high';
    }
  }

  // 優先度による調整
  if (priority === 'HIGHEST' && level === 'low') {
    reasons.push('最高優先度');
    level = 'medium';
  } else if (priority === 'HIGH' && level === 'low') {
    reasons.push('高優先度');
    level = 'medium';
  }

  // ステータスによる調整（確認待ちで緊急度が低い場合のみ上げる）
  if (status === 'PENDING_APPROVAL' && level === 'low') {
    reasons.push('確認待ち');
    level = 'medium';
  }

  return { level, reasons };
};

// 緊急度レベルの色を取得
export const getUrgencyColor = (level: 'critical' | 'high' | 'medium' | 'low'): 'error' | 'warning' | 'info' | 'success' => {
  switch (level) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
  }
}; 