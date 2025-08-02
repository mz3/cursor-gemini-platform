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
    '^../config/database\\.js$': '<rootDir>/src/config/database.ts',
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
};
