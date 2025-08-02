// Refactored: This is now the base config for shared settings
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  passWithNoTests: true,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        moduleResolution: 'node',
        target: 'ES2022',
        lib: ['ES2020'],
        allowImportingTsExtensions: false,
        noEmit: true
      }
    }],
  },
};
