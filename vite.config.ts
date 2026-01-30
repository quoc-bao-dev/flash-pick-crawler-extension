import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
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
      },
      output: {
        entryFileNames: `[name].js`
      }
    }
  }
})
