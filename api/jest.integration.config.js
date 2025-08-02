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
    '^../entities/(.*)\\\\.js$': '<rootDir>/src/entities/$1.ts',
    '^./Application\\.js$': '<rootDir>/src/entities/Application.ts',
    '^./User\\.js$': '<rootDir>/src/entities/User.ts',
    '^./Model\\.js$': '<rootDir>/src/entities/Model.ts',
    '^./Entity\\.js$': '<rootDir>/src/entities/Entity.ts',
    '^./Bot\\.js$': '<rootDir>/src/entities/Bot.ts',
    '^./BotInstance\\.js$': '<rootDir>/src/entities/BotInstance.ts',
    '^./BotTool\\.js$': '<rootDir>/src/entities/BotTool.ts',
    '^./ChatMessage\\.js$': '<rootDir>/src/entities/ChatMessage.ts',
    '^./Component\\.js$': '<rootDir>/src/entities/Component.ts',
    '^./Template\\.js$': '<rootDir>/src/entities/Template.ts',
    '^./Workflow\\.js$': '<rootDir>/src/entities/Workflow.ts',
    '^./WorkflowAction\\.js$': '<rootDir>/src/entities/WorkflowAction.ts',
    '^./CodeTemplate\\.js$': '<rootDir>/src/entities/CodeTemplate.ts',
    '^./Relationship\\.js$': '<rootDir>/src/entities/Relationship.ts',
    '^./Prompt\\.js$': '<rootDir>/src/entities/Prompt.ts',
    '^./PromptVersion\\.js$': '<rootDir>/src/entities/PromptVersion.ts',
    '^./UserSettings\\.js$': '<rootDir>/src/entities/UserSettings.ts',
    '^./Feature\\.js$': '<rootDir>/src/entities/Feature.ts',
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
