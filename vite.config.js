import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      manifest: {
        name: 'Field Geology PWA',
        short_name: 'Geology',
        description: 'PWA для сбора геологических данных',
        theme_color: '#667eea',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: []
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
})
