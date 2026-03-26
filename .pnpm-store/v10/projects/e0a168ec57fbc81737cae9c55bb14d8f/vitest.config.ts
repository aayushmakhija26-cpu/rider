import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    exclude: ['node_modules', 'dist', 'tests/e2e/**', 'tests/a11y/**'],
  },
});
