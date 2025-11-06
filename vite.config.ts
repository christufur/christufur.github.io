import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        projects: resolve(__dirname, 'projects.html'),
        reading: resolve(__dirname, 'reading.html'),
        music: resolve(__dirname, 'music.html'),
        contact: resolve(__dirname, 'contact.html'),
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
