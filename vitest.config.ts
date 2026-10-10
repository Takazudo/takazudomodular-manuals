import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: '@takazudo/zfb/zudo-react' },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    environment: 'happy-dom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'out', 'doc', 'worktrees', 'e2e'],
    globals: true,
  },
});
