// Jest configuration for Next.js project
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/../jest/(.*)$': '<rootDir>/jest/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/_*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    // Reactコンポーネントを除外（フロントエンド開発時に再度含める）
    '!src/app/page.tsx',
    '!src/app/layout.tsx',
    '!src/app/components/**',
    '!src/app/hooks/**'
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
  setupFilesAfterEnv: ['<rootDir>/jest/setupTests.js'],
};

module.exports = config; 