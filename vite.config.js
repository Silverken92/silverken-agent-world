import { defineConfig } from 'vite'
import { apiMiddleware } from './server/api.mjs'
import { governedActionHandler } from './server/governed-actions.mjs'
import { loadLocalConfig } from './server/local-config.mjs'

await loadLocalConfig()

/**
 * Vite dev must expose the same governed-action route as the production server.
 * Keep the dedicated handler ahead of the generic /api middleware: apiMiddleware
 * intentionally knows nothing about this AW7 mutation-request gateway.
 */
export function devApiMiddleware(req, res, next) {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/api/governed-action') {
    return governedActionHandler(req, res)
  }
  return apiMiddleware(req, res, next)
}

/** Serves /api from inside the Vite dev server, so `npm run dev` is the whole game. */
const api = () => ({
  name: 'bot-crossing-api',
  configureServer(server) {
    server.middlewares.use(devApiMiddleware)
  },
})

export default defineConfig({
  plugins: [api()],
  // PORT lets a second copy run alongside the first without a flag on the command line.
  server: { port: Number(process.env.PORT) || 5274, strictPort: false },
  build: { target: 'esnext' },
})
