import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const host = process.env.TAURI_DEV_HOST;

// 读取package.json获取版本号
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
const version = packageJson.version;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [vue()],

  // 使用相对路径，确保在 Tauri 应用中能正确加载资源
  base: './',

  // 定义全局常量
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },

  // 构建目标：保持 Chrome 87+ 兼容性（确保 Windows 7 支持）
  build: {
    target: ['chrome87', 'edge88', 'firefox78', 'safari14'],
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 5173,
    strictPort: true,
    host: host || '127.0.0.1',
    hmr: host
      ? {
        protocol: 'ws',
        host,
        port: 5174,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
}));
