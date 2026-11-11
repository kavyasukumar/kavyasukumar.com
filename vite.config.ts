import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { THEME_STORAGE_KEY, themeVars } from './src/theme-vars';

// Pre-paint theme boot, injected inline at the end of <head> on every page (index.html and
// dataviz.html). Reads the stored mode (else the OS preference) and sets the shared theme
// variables, the page colours, data-theme and theme-color on <html> before first paint.
// src/theme-mode.ts does the same at runtime (toggle, other tabs, OS changes).
const themeBoot = (): Plugin => {
  const vars = JSON.stringify({ light: themeVars('light'), dark: themeVars('dark') });
  const code = `(function(){var V=${vars},m;try{m=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}` +
    `if(m!=='dark'&&m!=='light')m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';` +
    `var r=document.documentElement,v=V[m];for(var k in v)r.style.setProperty(k,v[k]);` +
    `r.style.backgroundColor=v['--bg'];r.style.color=v['--fg'];r.setAttribute('data-theme',m);` +
    `var c=document.querySelector('meta[name="theme-color"]');if(c)c.setAttribute('content',v['--bg'])})();`;
  return {
    name: 'theme-boot',
    transformIndexHtml: () => [{ tag: 'script', children: code, injectTo: 'head' }]
  };
};

export default defineConfig({
  plugins: [react(), themeBoot()],
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