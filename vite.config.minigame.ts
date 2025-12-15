import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'replace-new-function',
      transform(code) {
        return code.replace(/new Function\("return this"\)\(\)/g, 'window');
      }
    }
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main-minigame.ts'),
      name: 'MiniGame',
      fileName: () => 'game.js', // 输出为 game.js
      formats: ['iife'] // 立即执行函数，适合直接运行
    },
    outDir: 'dist-minigame',
    emptyOutDir: true,
    rollupOptions: {
      external: [], // 将所有依赖打包进去
      output: {
        extend: true,
        globals: {}
      }
    },
    target: 'es2015', // 降低目标版本以兼容更多环境
    minify: false // 调试方便，发布时可开启
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});
