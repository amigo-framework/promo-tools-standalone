import { defineConfig } from 'vite'
import { resolve } from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    svelte(),
    dts({
      insertTypesEntry: true,
    })
  ],
  server: {
    port: 4001,
    host: true,
    cors: true
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PromoTools',
      formats: ['es', 'umd'],
      fileName: (format) => `promo-tools.${format}.js`
    },
    rollupOptions: {
      external: [], // Don't externalize dependencies for UMD
      output: {
        globals: {},
        inlineDynamicImports: false, // Allow code splitting
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})