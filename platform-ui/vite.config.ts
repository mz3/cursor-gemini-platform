import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'test' ? 'http://localhost:4000' : 'http://platform-api:4000',
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
