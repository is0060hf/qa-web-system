// Jest configuration for Next.js project
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  // テスト環境を jsdom に変更 (ブラウザのような DOM API を提供)
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
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    }],
  },
  transformIgnorePatterns: [
    // node_modules 内のファイルもトランスパイルする
    "node_modules/(?!@mui|react-query|react-dnd)"
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/_*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    // フロントエンドコンポーネントを含めるように修正
    '!src/app/page.tsx',
    '!src/app/layout.tsx',
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
};

module.exports = config; 