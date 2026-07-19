import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    watch: false
  }
});
