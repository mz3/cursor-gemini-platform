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
  },
  transform: {
    '^.+\\\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json'
    }],
  },
};
