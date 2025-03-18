import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // host: 'IntelliStay.staff', // Uncomment if needed
    port: 5174
  },
  assetsInclude: ['**/*.shard1', '**/*.json'],
  build: {
    outDir: 'dist',
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
});