import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'vite.svg'],
      manifest: {
        name: 'Ambassador Portal',
        short_name: 'Ambassadors',
        description: 'Sales Ambassador Portal for Green Truth NYC',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000, // 4MB
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // CRITICAL: Exclude Firebase internal paths from Service Worker
        // This allows Firebase Auth popups to work correctly
        navigateFallbackDenylist: [/^\/__\/.*/]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['lucide-react', 'framer-motion'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],
          'vendor-ai': ['@google/generative-ai'],
          // Split large feature modules
          'feature-admin': [
            './src/pages/admin/Dashboard.jsx',
          ],
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase limit since we're intentionally chunking
  },
  esbuild: {
    // Remove console.log in production builds (keeps console.error, console.warn for debugging)
    pure: process.env.NODE_ENV === 'production' ? ['console.log'] : [],
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : []
  },
})
