import { defineConfig } from 'vite';
import { nitro } from 'nitro-js/vite';

export default defineConfig({
  plugins: [
    ...nitro({
      ssr: true, // Enable SSR mode
      handlerPath: 'src/entry.server.tsx'
    })
  ],
});