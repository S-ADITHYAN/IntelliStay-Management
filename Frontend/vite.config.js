import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build:{
    outDir: 'dist',
  },
  server:{
    // host: 'IntelliStay',
    port: 5173,
    // host: true,
    // https: true
  },
  assetsInclude: ['**/*.shard1', '**/*.json'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.shard1')) {
            return 'assets/models/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['public/models/*']
  }
})
