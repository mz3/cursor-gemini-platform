// Set NODE_ENV to test to ensure services use mock responses instead of real API calls
process.env.NODE_ENV = 'test';

console.log('🔧 Test setup: NODE_ENV =', process.env.NODE_ENV);

// Disable console.log during tests to reduce noise
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  // Only log if it's not a test-related log
  const message = args.join(' ');
  if (!message.includes('Found code-builder bot') && 
      !message.includes('Stopped existing bot instance') &&
      !message.includes('Started bot:') &&
      !message.includes('Stopped bot:') &&
      !message.includes('Created test model:') &&
      !message.includes('Test setup:') &&
      !message.includes('Created application:') &&
      !message.includes('Started code-builder bot') &&
      !message.includes('Skipping bot chat') &&
      !message.includes('Build triggered:') &&
      !message.includes('Build triggered successfully') &&
      !message.includes('No Docker image found yet') &&
      !message.includes('Application status:') &&
      !message.includes('Created complex application:') &&
      !message.includes('Complex application build triggered') &&
      !message.includes('Docker version:') &&
      !message.includes('Available Docker images:') &&
      !message.includes('Test-related Docker images:') &&
      !message.includes('Concurrent build request') &&
      !message.includes('Cleaned up test application') &&
      !message.includes('Cleaned up test model') &&
      !message.includes('No test Docker images to clean up') &&
      !message.includes('Successfully associated prompt with test bot')) {
    originalConsoleLog(...args);
  }
}; 