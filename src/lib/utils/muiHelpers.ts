import { ChipProps } from '@mui/material/Chip';

// MUI ChipコンポーネントのcolorプロパティのUnion型
export type ChipColor = ChipProps['color'];

// 文字列をChipの有効なcolor値に変換するヘルパー関数
export function getChipColor(color: string): ChipColor {
  const validColors: ChipColor[] = ['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning'];
  
  if (validColors.includes(color as ChipColor)) {
    return color as ChipColor;
  }
  
  return 'default';
}

// ステータスに基づいてChipのcolorを取得するヘルパー関数
export function getStatusChipColor(status: string): ChipColor {
  switch (status) {
    case '回答中':
    case 'IN_PROGRESS':
      return 'primary';
    case '承認待ち':
    case 'PENDING_APPROVAL':
      return 'warning';
    case 'クローズ':
    case 'CLOSED':
      return 'success';
    case '新規':
    case 'NEW':
      return 'info';
    default:
      return 'default';
  }
}

// 優先度に基づいてChipのcolorを取得するヘルパー関数
export function getPriorityChipColor(priority: string): ChipColor {
  switch (priority) {
    case '最高':
    case 'HIGHEST':
    case '高':
    case 'HIGH':
      return 'error';
    case '中':
    case 'MEDIUM':
      return 'warning';
    case '低':
    case 'LOW':
      return 'info';
    default:
      return 'default';
  }
}

// プロジェクトステータスに基づいてChipのcolorを取得するヘルパー関数
export function getProjectStatusChipColor(status: string): ChipColor {
  switch (status) {
    case 'ACTIVE':
    case 'アクティブ':
      return 'success';
    case 'DRAFT':
    case '下書き':
      return 'default';
    case 'ARCHIVED':
    case 'アーカイブ済み':
      return 'warning';
    default:
      return 'default';
  }
} 