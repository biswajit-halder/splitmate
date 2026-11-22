import type { Context, Next } from 'hono'
import { ForbiddenError } from '../errors/AppError'
import type { AppEnv } from '../types'

/**
 * Defence in depth for cookie-authenticated mutations: reject state-changing
 * requests whose Origin header does not match APP_ORIGIN. Requests without an
 * Origin header (server-to-server, tests) are allowed through.
 */
export async function originGuard(c: Context<AppEnv>, next: Next) {
  const method = c.req.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next()

  const origin = c.req.header('origin')
  const expected = c.env.APP_ORIGIN
  if (origin && expected && origin !== expected) {
    throw new ForbiddenError('Request origin is not allowed')
  }
  await next()
}
