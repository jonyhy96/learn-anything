import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // exclude Playwright specs from the Vitest run
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
