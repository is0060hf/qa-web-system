'use client';

import { useEffect } from 'react';

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // CSRFトークンの初期取得（リトライロジック付き）
    const initializeCsrfToken = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          // CSRFトークンがCookieに存在しない場合のみ取得
          const hasToken = document.cookie
            .split('; ')
            .some(row => row.startsWith('csrf-token='));
          
          if (!hasToken) {
            const response = await fetch('/api/auth/csrf-token');
            if (!response.ok) {
              throw new Error(`Failed to fetch CSRF token: ${response.status}`);
            }
            console.log('[SecurityProvider] CSRF token initialized');
          }
          return; // 成功したらリトライループを抜ける
        } catch (error) {
          console.error(`[SecurityProvider] Attempt ${i + 1} failed:`, error);
          
          // 最後の試行でも失敗した場合はエラーを出力
          if (i === retries - 1) {
            console.error('[SecurityProvider] Failed to initialize CSRF token after all retries');
          } else {
            // 次のリトライまで待機（指数バックオフ）
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          }
        }
      }
    };

    initializeCsrfToken();
  }, []);

  return <>{children}</>;
} 