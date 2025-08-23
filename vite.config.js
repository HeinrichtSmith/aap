import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large dependencies into separate chunks
          'framer-motion': ['framer-motion'],
          'lucide-react': ['lucide-react'],
          'react-router': ['react-router-dom'],
          'react-vendor': ['react', 'react-dom'],
          'audio-utils': ['src/utils/audio.js'],
          'packing-components': [
            'src/components/packing/PackingScreen.jsx',
            'src/components/packing/PackingItem.jsx',
            'src/components/packing/AnimatedPlaceholder.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false // Disable sourcemaps in production for smaller bundle
  }
})