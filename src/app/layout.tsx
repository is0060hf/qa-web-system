import './globals.css';
import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import AuthProvider from './auth-provider';
import { AccessibilityProvider } from '../components/providers/AccessibilityProvider';

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
  colorScheme: 'light',
  themeColor: '#1976d2', // Material UIのプライマリカラー
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
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AccessibilityProvider>
              <main id="main-content">
                {children}
              </main>
            </AccessibilityProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 