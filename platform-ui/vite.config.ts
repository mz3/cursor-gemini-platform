import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Determine proxy target based on environment
const isLocal = process.env.NODE_ENV === 'development' || !process.env.CI;
const apiTarget = isLocal ? 'http://localhost:4000' : 'http://platform-api:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'cursor-gemini-platform-ui.fly.dev',
      'localhost',
      '127.0.0.1'
    ],
  },
});
