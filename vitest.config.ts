import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Integration tests (src/*.vscode.test.ts) only run inside VS Code via @vscode/test-cli.
    exclude: ['src/**/*.vscode.test.ts', 'node_modules/**'],
  },
});
