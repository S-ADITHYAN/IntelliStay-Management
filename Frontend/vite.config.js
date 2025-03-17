import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
 
  server:{
    // host: 'IntelliStay',
    port: 5173,
    host: true,
    // https: true
  },
  assetsInclude: ['**/*.shard1', '**/*.json'],
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: true,
    chunkSizeWarningLimit: 1000000000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      external: ['tesseract.js-core'],
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('tesseract.js')) {
              return 'tesseract';
            }
            return 'vendor';
          }
        }
      }
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    },
    include: ['tesseract.js']
  },
  resolve: {
    alias: {
      'tesseract.js': 'tesseract.js/dist/tesseract.min.js'
    }
  }
})
