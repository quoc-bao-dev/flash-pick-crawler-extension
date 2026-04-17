import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }): any => {
  // Build riêng crawler dưới dạng IIFE (không dùng import/export) để inject được vào World MAIN
  if (mode === 'crawler') {
    return {
      build: {
        outDir: 'dist',
        emptyOutDir: false, // Giữ lại dist cũ
        rollupOptions: {
          input: {
            crawler: resolve(__dirname, 'src/extentions/crawler.ts'),
          },
          output: {
            format: 'iife',
            entryFileNames: `[name].js`,
            inlineDynamicImports: true
          }
        }
      }
    }
  }

  return {
    plugins: [react(), viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.'
        }
      ]
    })],

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
          background: resolve(__dirname, 'src/extentions/background.ts'),
          content: resolve(__dirname, 'src/extentions/content.ts'),
          agent: resolve(__dirname, 'src/extentions/agent.ts'),
        },
        output: {
          entryFileNames: `[name].js`
        }
      }
    }
  }
})
