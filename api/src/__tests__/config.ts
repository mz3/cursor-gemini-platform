// Test configuration for integration tests
export const TEST_CONFIG = {
  API_BASE_URL: process.env.API_URL || 'http://localhost:4000',
  TEST_TIMEOUT: 30000,
  TEST_USER: {
    email: 'admin@platform.com',
    password: 'admin123'
  }
};
