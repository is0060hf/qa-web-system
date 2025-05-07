/**
 * 日付文字列をフォーマットする関数
 * @param dateString ISO形式の日付文字列
 * @returns フォーマットされた日付文字列 (例: 2023/01/01 12:34)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
} 