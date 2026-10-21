/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiOrigin = env.VITE_API_URL?.trim()
    ? new URL(env.VITE_API_URL).origin
    : mode === 'production'
      ? ''
      : 'http://localhost:3001';

  return {
    plugins: [
      react(),
      {
        name: 'api-content-security-policy',
        transformIndexHtml(html) {
          return html.replaceAll('http://localhost:3001', apiOrigin);
        },
      },
    ],
    server: {
      port: 5173,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
