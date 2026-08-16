import { getCookie } from 'hono/cookie'
import type { Context, Next } from 'hono'
import { UnauthorizedError } from '../errors/AppError'
import { verifyToken } from '../lib/auth'
import type { AppEnv } from '../types'

export const COOKIE_NAME = 'splitmate_session'

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const userId = await resolveUserId(c)
  if (!userId) throw new UnauthorizedError('Not authenticated')
  c.set('userId', userId)
  await next()
}

export async function optionalAuth(c: Context<AppEnv>, next: Next) {
  const userId = await resolveUserId(c)
  if (userId) c.set('userId', userId)
  await next()
}

async function resolveUserId(c: Context<AppEnv>): Promise<string | null> {
  const secret = c.env.JWT_SECRET
  const cookieToken = getCookie(c, COOKIE_NAME)
  const authHeader = c.req.header('authorization')
  let token = cookieToken
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length).trim()
  }
  if (!token) return null
  try {
    const payload = await verifyToken(token, secret)
    return payload.sub
  } catch {
    return null
  }
}
