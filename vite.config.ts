import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    // Use esbuild for fast, aggressive minification
    minify: 'esbuild',
    // Minify CSS assets
    cssMinify: true,
    // Specify target for modern browsers to reduce polyfill bloat
    target: 'esnext',
    
    // Configure Rollup to split out vendor chunks
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dataviz: resolve(__dirname, 'dataviz.html')
      },
      output: {
        manualChunks: {
          // Group React and React DOM into a 'vendor' chunk
          vendor: ['react', 'react-dom'],
          // Group the Lucide icons into an 'icons' chunk
          icons: ['@phosphor-icons/react']
        }
      }
    }
  },
  esbuild: {
    // Automatically strip out console logs and debuggers from the production build
    drop: ['console', 'debugger'],
  }
});