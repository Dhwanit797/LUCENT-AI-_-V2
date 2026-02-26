import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE

  const proxy =
    apiBase && apiBase.length > 0
      ? {
          '/auth': { target: apiBase, changeOrigin: true },
          '/health': { target: apiBase, changeOrigin: true },
          '/expense': { target: apiBase, changeOrigin: true },
          '/fraud': { target: apiBase, changeOrigin: true },
          '/inventory': { target: apiBase, changeOrigin: true },
          '/green-grid': { target: apiBase, changeOrigin: true },
          '/recommendations': { target: apiBase, changeOrigin: true },
          '/carbon': { target: apiBase, changeOrigin: true },
          '/report': { target: apiBase, changeOrigin: true },
          '/chat': { target: apiBase, changeOrigin: true },
          '/ai': { target: apiBase, changeOrigin: true },
        }
      : undefined

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy,
    },
  }
})
