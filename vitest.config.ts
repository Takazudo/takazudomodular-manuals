import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import path from 'path';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Mirror tsconfig.zfb.json: alias react/react-dom → preact/compat so
      // any file that still imports 'react' (e.g. language-context which has
      // no zfb equivalent yet — deleted in #137) resolves through Preact.
      // @testing-library/preact depends on this alias for its own internals.
      react: path.resolve(__dirname, 'node_modules/preact/compat'),
      'react-dom': path.resolve(__dirname, 'node_modules/preact/compat'),
      // react-dom/server maps to preact/compat/server (used by language-context test).
      'react-dom/server': path.resolve(__dirname, 'node_modules/preact/compat/server'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/preact/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/preact/jsx-runtime'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'out', 'doc', 'worktrees', 'e2e'],
    globals: true,
  },
});
