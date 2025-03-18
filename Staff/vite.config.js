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
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'mui': ['@mui/material'],
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            '@emotion/react',
            '@emotion/styled'
          ]
        },
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