import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'process';

export default defineConfig(({ mode }) => {
  // .envファイルから環境変数を読み込む
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // process.env.API_KEY をブラウザ上で有効にする
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
