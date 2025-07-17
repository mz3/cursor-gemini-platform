/// <reference types="node" />
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    env: {
      apiUrl: 'http://localhost:4000',
      testEmail: 'admin@platform.com',
      testPassword: 'admin123'
    },
    setupNodeEvents(on, config) {
      // Override baseUrl and env from command line arguments
      if (config.env.baseUrl) {
        config.baseUrl = config.env.baseUrl;
      }
      return config;
    }
  },
});
