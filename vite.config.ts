import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        projects: resolve(__dirname, 'pages/projects.html'),
        reading: resolve(__dirname, 'pages/reading.html'),
        music: resolve(__dirname, 'pages/music.html'),
        contact: resolve(__dirname, 'pages/contact.html'),
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
