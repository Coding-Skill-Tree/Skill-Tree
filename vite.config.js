import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function productionSecurityMeta() {
  return {
    name: 'production-security-meta',
    transformIndexHtml(html, context) {
      if (context.server) return html
      const policy = "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'"
      return html.replace('</head>', `  <meta http-equiv="Content-Security-Policy" content="${policy}" />\n  </head>`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), productionSecurityMeta()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: false,
      },
    },
  },
})
