import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    // vscode-test用のファイルを無視するように設定
    exclude: ['**/test-resources/**', '**/out/**', '**/node_modules/**', '**/*.e2e.test.ts'],
    // もし DOM のテスト (main.ts) もしたいなら以下を追加
    // environment: 'happy-dom',
  },
});