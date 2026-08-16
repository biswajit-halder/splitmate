import type { Context, Next } from 'hono'
import type { AppEnv } from '../types'

export async function corsMiddleware(c: Context<AppEnv>, next: Next) {
  const origin = c.env.APP_ORIGIN
  c.header('Access-Control-Allow-Origin', origin)
  c.header('Access-Control-Allow-Credentials', 'true')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.header('Vary', 'Origin')

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }
  await next()
}
