import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import fs from 'fs'
import path from 'path'

// Permitir deshabilitar HTTPS con variable de entorno (útil para desarrollo local)
const useHttps = process.env.VITE_USE_HTTPS !== 'false'

// Configuración HTTPS
const httpsConfig = (() => {
  if (!useHttps) {
    return false
  }

  const certPath = path.resolve(__dirname, 'certs/localhost.crt')
  const keyPath = path.resolve(__dirname, 'certs/localhost.key')
  
  // Si los certificados existen, usarlos
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    try {
      return {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      }
    } catch (error) {
      console.warn('⚠️  Error al leer certificados, usando HTTP en lugar de HTTPS')
      return false
    }
  }
  
  // Si no existen certificados, usar HTTP por defecto para evitar problemas de compatibilidad
  // Para usar HTTPS automático, descomenta la siguiente línea:
  // return true
  console.warn('⚠️  No se encontraron certificados SSL. Usando HTTP.')
  console.warn('   Para usar HTTPS, ejecuta: npm run generate-cert')
  return false
})()

// Base path for Supabase Storage: set VITE_BASE_URL=/storage/v1/object/public/<bucket>/ when deploying to Storage
const base = process.env.VITE_BASE_URL || ''

// HOST=local → solo localhost; HOST=network|ip o no definido → accesible por IP en la red
const hostMode = process.env.HOST === 'local' ? 'localhost' : true

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_'])
  return {
  base,
  define: {
    'import.meta.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL || ''),
    'import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''),
  },
  plugins: [nodePolyfills(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      xlsx: path.resolve(__dirname, './node_modules/xlsx-js-style'),
    },
  },
  server: {
    host: hostMode,
    port: parseInt(process.env.PORT || '3000'),
    https: httpsConfig,
    open: false,
    cors: true,
  },
  preview: {
    host: hostMode,
    port: parseInt(process.env.PORT || '3000'),
    https: httpsConfig,
    cors: true,
  },
  build: {
    target: 'esnext',
    sourcemap: mode === 'production' ? false : true,
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules/')) return
          if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) {
            return 'react-vendor'
          }
          if (
            id.includes('lucide-react') ||
            id.includes('framer-motion') ||
            id.includes('clsx') ||
            id.includes('tailwind-merge')
          ) {
            return 'ui-vendor'
          }
          if (id.includes('@tanstack/react-query') || id.includes('@supabase/supabase-js')) {
            return 'data-vendor'
          }
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts-vendor'
          }
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('xlsx')) {
            return 'export-vendor'
          }
          return 'vendor'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true,
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
  },
  }
})
