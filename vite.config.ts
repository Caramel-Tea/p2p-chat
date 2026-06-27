import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    electron([
      {
        // 1. 主进程配置
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main', 
            rollupOptions: {
              output: {
                entryFileNames: 'index.js'
              }
            }
          }
        }
      },
      {
        // 2. 预加载脚本配置
        entry: 'src/preload/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/preload', 
            rollupOptions: {
              output: {
                entryFileNames: 'index.js'
              }
            }
          }
        }
      }
    ]),
    renderer(),
  ],
})
