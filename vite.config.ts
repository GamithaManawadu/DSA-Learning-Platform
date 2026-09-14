import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Netlify serves from the domain root. Change to './' only if you deploy
  // into a subdirectory.
  base: '/',
  // The practice sandbox is a module worker; be explicit so the build does not
  // silently fall back to a classic worker.
  worker: { format: 'es' },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
