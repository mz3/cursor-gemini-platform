import baseConfig from './jest.config.js';

export default {
  ...baseConfig,
  testMatch: ['**/__tests__/**/*.integration.ts'],
  testEnvironment: 'node',
  testTimeout: 30000,
  // Ensure proper ESM handling
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\\\.{1,2}/.*)\\\\.js$': '$1',
    '^../services/botExecutionService\\.js$': '<rootDir>/src/__tests__/mocks/botExecutionService.ts',
  },
  transform: {
    '^.+\\\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json'
    }],
  },
  // Add module resolution settings
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Set NODE_ENV to test to ensure services use mock responses
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
