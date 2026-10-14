import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',  
  server: {
    port: 4173,
    host: 'localhost',
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',           // Fast minify
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    assetsInlineLimit: 4096,

    // ⚠️ NO manualChunks — let Vite handle everything
    // This prevents the React.PureComponent error
    
    rollupOptions: {
      output: {
        // Only split into 2 chunks (entry + vendor)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },

  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      'axios', 'recharts', 'lucide-react',
      'react-hook-form', 'zod', '@hookform/resolvers/zod',
      'react-hot-toast', 'clsx',
    ],
  },
});
// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173,
//     host: 'localhost',
//     strictPort: false,
//   },
//   build: {
//     outDir: 'dist',
//     sourcemap: false,
//   },
// });