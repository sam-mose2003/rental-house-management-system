import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    define: {
      __APP_ENV__: JSON.stringify(isProduction ? 'production' : 'development'),
      __API_BASE_URL__: JSON.stringify(
        isProduction 
          ? 'https://your-render-backend-url.onrender.com'  // Replace with your actual Render URL
          : 'http://localhost:5000'
      )
    }
  }
})
