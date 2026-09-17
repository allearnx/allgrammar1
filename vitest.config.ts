import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // .claude/** = 다른 세션의 worktree — 안 막으면 그쪽 e2e/테스트가 딸려와 수백 건 가짜 실패
    exclude: ['e2e/**', 'node_modules/**', '.claude/**', '**/.claude/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/supabase/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
