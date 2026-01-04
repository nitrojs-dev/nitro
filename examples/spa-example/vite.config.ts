import { defineConfig } from 'vite';
import { nitro } from 'nitro-js/vite';

export default defineConfig({
  plugins: [
    ...nitro({
      ssr: false, // Enable SPA mode
      clientEntry: 'src/main.tsx'
    })
  ],
});