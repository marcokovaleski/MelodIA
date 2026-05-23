import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const webhookProxyTarget = env.VITE_WEBHOOK_PROXY_TARGET

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '127.0.0.1',
      proxy:
        mode === 'development' && webhookProxyTarget
          ? {
              '/webhook': {
                target: webhookProxyTarget,
                changeOrigin: true,
                secure: webhookProxyTarget.startsWith('https://'),
                rewrite: (path) => path,
              },
            }
          : undefined,
    },
  }
})
