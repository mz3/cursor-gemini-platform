import base from './jest.config.js';

export default {
  ...base,
  testMatch: [
    "<rootDir>/src/**/*.test.ts"
  ],
};
