import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/**/*.vscode.test.js',
  // Keep the test instance isolated from the user's installed extensions.
  launchArgs: ['--disable-extensions'],
});
