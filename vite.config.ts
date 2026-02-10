import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Permitir deshabilitar HTTPS con variable de entorno (útil para desarrollo local)
const useHttps = process.env.VITE_USE_HTTPS !== 'false'

// Configuración HTTPS (undefined = HTTP; Vite no acepta false en server.https)
const httpsConfig = ((): { cert: Buffer; key: Buffer } | undefined => {
  if (!useHttps) {
    return undefined
  }

  const certPath = path.resolve(__dirname, 'certs/localhost.crt')
  const keyPath = path.resolve(__dirname, 'certs/localhost.key')

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    try {
      return {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      }
    } catch {
      return undefined
    }
  }

  return undefined
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
    'process.env.NODE_ENV': JSON.stringify(mode),
    global: 'globalThis',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      xlsx: path.resolve(__dirname, './node_modules/xlsx-js-style'),
    },
  },
  server: {
    host: hostMode,
    port: parseInt(process.env.PORT || '3000'),
    ...(httpsConfig && { https: httpsConfig }),
    open: false,
    cors: true,
  },
  preview: {
    host: hostMode,
    port: parseInt(process.env.PORT || '3000'),
    ...(httpsConfig && { https: httpsConfig }),
    cors: true,
  },
  build: {
    // CRÍTICO PARA TV: compatibilidad con navegadores Smart TV antiguos (aprox. 2017+)
    target: 'es2015',
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts-vendor': ['recharts'],
          'data-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
          'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
  },
  }
})
