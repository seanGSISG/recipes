// @ts-check
import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://recipes.lsdmt.me',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Recipes',
        short_name: 'Recipes',
        description: 'Personal recipe collection',
        theme_color: '#b04a2f',
        background_color: '#fafaf7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // No navigateFallback — every URL has a real precached HTML file (multi-page static site).
        // A fallback would hijack /recipes/<slug>/cook/ and serve the index instead.
        navigateFallback: null,
        globPatterns: ['**/*.{html,css,js,svg,ico,png,jpg,webp,woff2,webmanifest,json}'],
        // Don't precache the recipe images (would inflate the SW); cache them at runtime instead.
        globIgnores: ['**/images/recipes/**'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/images/recipes/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'recipe-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
