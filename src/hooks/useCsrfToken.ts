import { useEffect, useState } from 'react';

export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf-token');
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.token);
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCsrfToken();
  }, []);

  return { csrfToken, isLoading };
}

// APIリクエストにCSRFトークンを含めるヘルパー関数
export function addCsrfToken(headers: HeadersInit = {}, csrfToken: string | null): HeadersInit {
  if (!csrfToken) return headers;

  if (headers instanceof Headers) {
    headers.set('X-CSRF-Token', csrfToken);
    return headers;
  }

  return {
    ...headers,
    'X-CSRF-Token': csrfToken,
  };
} 