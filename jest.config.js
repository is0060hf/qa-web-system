// Jest configuration for Next.js project
/** @type {import('jest').Config} */
const config = {
  // ESモジュールサポートのためにプリセットを調整
  testEnvironment: 'jsdom',
  // テストファイルパターンを更新
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx' // React コンポーネントのテスト
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/../jest/(.*)$': '<rootDir>/jest/$1',
    // CSS モジュールとアセットのモック
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/jest/fileMock.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ES2020',
        target: 'ES2020'
      }
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { 
          targets: { node: 'current' },
          modules: 'auto'
        }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    }],
  },
  transformIgnorePatterns: [
    // ESモジュールのライブラリをトランスフォーム対象に含める
    "node_modules/(?!(jose|@next|@mui|react-query|react-dnd)/)"
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: false, // 一時的にカバレッジを無効化
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/_*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    // フロントエンドコンポーネントを除外（JSX解析エラーを回避）
    '!src/app/page.tsx',
    '!src/app/layout.tsx',
    '!src/app/**/page.tsx',
    '!src/app/**/*.tsx',
    '!src/components/**/*.tsx',
  ],
  coverageThreshold: {
    global: {
      // バックエンドAPI実装段階に適した閾値
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest/setupTests.js',
    '<rootDir>/jest/setupTestsReact.js' // React Testing Library の設定ファイル
  ],
  // ESモジュールのサポートを改善
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // 実験的なESMサポート
  testEnvironmentOptions: {
    // jsdomでESMサポートを有効化
    url: 'http://localhost'
  }
};

module.exports = config; 