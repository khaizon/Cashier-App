import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Which path the SPA is served under.
 *
 * Two deployments have to coexist:
 *  - GitHub Pages serves the committed `docs/` under `/Cashier-App/`.
 *  - The container serves the same build from nginx at the root, and can sit
 *    behind an ingress on any prefix.
 *
 * An explicit `undefined` check is used instead of `??` on purpose: an empty
 * `VITE_BASE_PATH` means "serve from the root", which is a value, not a missing
 * one.
 */
const BASE_PATH = (() => {
  const raw = process.env.VITE_BASE_PATH;
  if (raw === undefined) return '/Cashier-App/';
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '/' || trimmed === './') return './';
  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}/`;
})();

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.png'],
      workbox: {
        runtimeCaching: [
          {
            // Uploaded item images. These are immutable — replacing an item's
            // picture stores a new asset at a new URL — so they can be served
            // from cache indefinitely. Without this the till shows blank tiles
            // for every CMS-uploaded image while offline; the bundled sample
            // images are already covered by the precache.
            //
            // Same-origin only. If VITE_API_BASE_URL points somewhere else the
            // request never reaches this worker, and images need a connection.
            urlPattern: /\/api\/images\/[^/]+$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'item-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: `Mao Mao's Cashier App`,
        short_name: 'Cashier',
        description: 'maomaothinks cashier app',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    emptyOutDir: true,
    outDir: './docs',
  },
});
