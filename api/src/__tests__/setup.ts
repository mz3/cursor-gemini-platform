// Set NODE_ENV to test to ensure services use mock responses instead of real API calls
process.env.NODE_ENV = 'test';

console.log('🔧 Test setup: NODE_ENV =', process.env.NODE_ENV);

// Import Jest functions for ESM compatibility
import { jest } from '@jest/globals';

// Make jest available globally for test files
(global as any).jest = jest;

// Disable console.log during tests to reduce noise
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  // Only log if it's not a test-related log
  const message = args.join(' ');
  if (!message.includes('Found code-builder bot') &&
      !message.includes('Stopped existing bot instance') &&
      !message.includes('Started bot:') &&
      !message.includes('Stopped bot:') &&
      !message.includes('Created test schema:') &&
      !message.includes('Test setup:') &&
      !message.includes('Created application:') &&
      !message.includes('Started code-builder bot') &&
      !message.includes('Skipping bot chat') &&
      !message.includes('Build triggered:') &&
      !message.includes('Mock BotExecutionService.sendMessage called') &&
      !message.includes('Mock response:') &&
      !message.includes('🧪 Test environment detected, using mock response') &&
      !message.includes('🌐 Production environment, queuing message for async processing')
  ) {
    originalConsoleLog(...args);
  }
};
