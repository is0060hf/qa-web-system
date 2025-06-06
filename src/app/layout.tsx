import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import AuthProvider from './auth-provider';
import { AccessibilityProvider } from '../components/providers/AccessibilityProvider';
import ThemeRegistry from '../components/providers/ThemeRegistry';
import { SecurityProvider } from '../components/providers/SecurityProvider';

// フォント設定
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
});

export const metadata: Metadata = {
  title: '質問管理Webシステム',
  description: 'プロジェクト内での質問とその回答を効率的に管理するためのWebアプリケーション',
  // アクセシビリティ関連のメタデータ
  applicationName: '質問管理Webシステム',
  authors: [{ name: 'システム管理者' }],
};

export const viewport: Viewport = {
  themeColor: '#1976d2',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body>
        <AuthProvider>
          <ThemeRegistry>
            <SecurityProvider>
              <AccessibilityProvider>
                <main id="main-content">
                  {children}
                </main>
              </AccessibilityProvider>
            </SecurityProvider>
          </ThemeRegistry>
        </AuthProvider>
      </body>
    </html>
  );
} 