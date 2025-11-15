import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_BACKEND_URL || 'http://localhost:7001';

  return {
    base: mode === 'production' ? './' : '/',
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
    ],
    optimizeDeps: {
      exclude: ['fsevents'],
      esbuildOptions: {
        external: ['fsevents'],
      },
    },
    build: {
      rollupOptions: {
        external: ['fsevents', 'fsevents/fsevents.node'],
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api/auth': {
          target: backend,
          changeOrigin: true,
          secure: false,
        },
        '/trpc': {
          target: backend,
          changeOrigin: true,
        },
      },
    },
  };
});
