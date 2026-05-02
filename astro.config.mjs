// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://recipes.lsdmt.me',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
