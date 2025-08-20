// Refactored: This is now the base config for shared settings
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  passWithNoTests: true,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Ensure consistent module resolution to prevent "module already linked" errors
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json'
    }],
  },
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/__tests__/setup.ts',
    '/src/__tests__/mocks/'
  ],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  injectGlobals: true,
  // Clear module cache between tests to prevent module linking issues
  clearMocks: true,
  restoreMocks: true,
  resetModules: false,
};
