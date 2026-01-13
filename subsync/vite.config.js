import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        devOptions: {
          enabled: false,
          type: 'module'
        },
        workbox: {
          debug: false,
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigationPreload: false,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        },
        manifest: {
          name: 'RMS',
          short_name: 'RMS',
          description: 'Subscription management made easy',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
