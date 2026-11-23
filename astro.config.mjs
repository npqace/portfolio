import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://npqace.github.io',
  base: '/portfolio',
  build: { format: 'file', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});
