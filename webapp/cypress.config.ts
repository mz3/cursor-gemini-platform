/// <reference types="node" />
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_baseUrl || 'http://localhost:3000',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    env: {
      apiUrl: process.env.CYPRESS_apiUrl || 'http://localhost:4001',
      testEmail: process.env.CYPRESS_testEmail || 'admin@platform.com',
      testPassword: process.env.CYPRESS_testPassword || 'admin123'
    }
  },
});
