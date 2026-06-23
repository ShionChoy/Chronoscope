import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// VitePWA is build/dev-only; exclude it under Vitest so the unit suite never
// loads Workbox or a virtual SW module.
const pwa = process.env.VITEST
  ? []
  : [
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto', // no manual registerSW import needed
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Chronoscope',
          short_name: 'Chronoscope',
          description: 'A cross-scale event timeline, from deep time to this afternoon.',
          theme_color: '#11161d',
          background_color: '#11161d',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
        },
        workbox: {
          // Precache the built app shell so it opens offline.
          globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        },
      }),
    ]

export default defineConfig({
  plugins: [react(), ...pwa],
  test: { globals: true, environment: 'node' },
})
