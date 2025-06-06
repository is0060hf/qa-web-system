// 型定義
type SanitizableValue = string | number | boolean | null | undefined;
type SanitizableObject = {
  [key: string]: SanitizableValue | SanitizableObject | SanitizableValue[];
};

// CSRFトークンの生成（Edge Runtime互換）
export function generateCSRFToken(): string {
  // Node.js環境の場合
  if (typeof window === 'undefined' && typeof globalThis.crypto === 'undefined') {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
  
  // ブラウザまたはEdge Runtime環境の場合
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// HTMLエスケープ用のマップ
const htmlEscapeMap: { [key: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};

// HTMLエスケープ処理
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'\/]/g, (match) => htmlEscapeMap[match] || match);
}

// 危険なHTMLタグやスクリプトを除去
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // HTMLタグを除去（ただし一部の安全なタグは許可）
  const allowedTags = ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li', 'a'];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi;
  
  let sanitized = input.replace(tagRegex, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      // href属性のサニタイズ（aタグの場合）
      if (tag.toLowerCase() === 'a') {
        return match.replace(/href\s*=\s*["']?javascript:[^"'>]*/gi, 'href="#"');
      }
      return match;
    }
    return '';
  });
  
  // JavaScriptイベントハンドラの除去
  sanitized = sanitized.replace(/on[a-zA-Z]+\s*=\s*["'][^"']*["']/gi, '');
  
  // scriptタグの内容を完全に除去
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // styleタグの内容を完全に除去
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  return sanitized;
}

// オブジェクト内の全ての文字列値をサニタイズ
export function sanitizeObject<T extends SanitizableObject>(obj: T): T {
  const sanitized: any = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key] as SanitizableObject);
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = (sanitized[key] as SanitizableValue[]).map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    }
  }
  
  return sanitized as T;
}

// URLパラメータのサニタイズ
export function sanitizeUrlParam(param: string): string {
  return encodeURIComponent(param);
}

// SQLインジェクション対策（Prismaを使用している場合は基本的に不要だが、念のため）
export function escapeSqlString(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/['"\\\0\n\r\x1a]/g, (match) => {
    switch (match) {
      case "'": return "\\'";
      case '"': return '\\"';
      case '\\': return '\\\\';
      case '\0': return '\\0';
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '\x1a': return '\\Z';
      default: return match;
    }
  });
} 