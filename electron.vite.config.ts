import { defineConfig } from 'vite';
import { resolve } from 'path';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry file
        entry: 'electron/main.js',
        // Vite will bundle the main process source code
        vite: {
          build: {
            sourcemap: true,
            outDir: 'dist-electron',
          },
        },
      },
      {
        // Preload file entry
        entry: 'electron/preload.js',
        onstart(options) {
          // Start Electron when dev server is ready
          options.startup();
        },
        vite: {
          build: {
            sourcemap: true,
            outDir: 'dist-electron',
          },
        },
      },
    ]),
    renderer(),
    nodePolyfills({
      include: ['buffer', 'stream', 'util', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  resolve: {
    alias: {
      'date-fns': 'date-fns/esm'
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'google-vendor': ['@react-oauth/google', 'google-auth-library'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    }
  },
  // Electron configuration
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
}); 