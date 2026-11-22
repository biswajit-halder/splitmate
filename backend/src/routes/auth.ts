import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { ConflictError, UnauthorizedError } from '../errors/AppError'
import { hashPassword, signToken, verifyPassword } from '../lib/auth'
import { COOKIE_NAME } from '../middleware/auth'
import { loginRateLimit } from '../middleware/rateLimit'
import type { AppEnv } from '../types'
import { newId, nowIso } from '../utils/ids'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80),
  avatar_bg: z.string().optional(),
  remember: z.boolean().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
})

export const authRoutes = new Hono<AppEnv>()

function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string, maxAge?: number) {
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: c.env.COOKIE_SECURE === 'true',
    sameSite: (c.env.COOKIE_SAMESITE as 'Lax' | 'None' | 'Strict') || 'Lax',
    path: '/',
    ...(typeof maxAge === 'number' ? { maxAge } : {}),
  })
}

authRoutes.post('/register', loginRateLimit, async (c) => {
  const body = registerSchema.parse(await c.req.json())
  const { DB } = c.env
  const existing = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(body.email.toLowerCase()).first()
  if (existing) throw new ConflictError('Email already registered')

  const id = newId()
  const passwordHash = await hashPassword(body.password)
  await DB.prepare(
    'INSERT INTO users (id, email, password_hash, name, avatar_bg, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, body.email.toLowerCase(), passwordHash, body.name, body.avatar_bg ?? null, nowIso(), nowIso())
    .run()

  const token = await signToken({ sub: id, email: body.email.toLowerCase() }, c.env.JWT_SECRET)
  // Registering always starts a session; honor "remember" when provided.
  setSessionCookie(c, token, body.remember ? 2592000 : undefined)
  // The token itself is deliberately NOT returned in the body: the session
  // lives in an httpOnly cookie so that XSS cannot read it.
  return c.json({ user: { id, email: body.email.toLowerCase(), name: body.name, avatar_bg: body.avatar_bg ?? null } }, 201)
})

authRoutes.post('/login', loginRateLimit, async (c) => {
  const body = loginSchema.parse(await c.req.json())
  const { DB } = c.env
  const row = await DB.prepare('SELECT * FROM users WHERE email = ?').bind(body.email.toLowerCase()).first<{
    id: string
    email: string
    name: string
    avatar_bg: string | null
    password_hash: string
  }>()
  if (!row || !(await verifyPassword(body.password, row.password_hash))) {
    throw new UnauthorizedError('Invalid email or password')
  }
  const token = await signToken({ sub: row.id, email: row.email }, c.env.JWT_SECRET)
  // "Remember me" -> 30d cookie; otherwise a session cookie cleared on browser close.
  setSessionCookie(c, token, body.remember ? 2592000 : undefined)
  // The token itself is deliberately NOT returned in the body: the session
  // lives in an httpOnly cookie so that XSS cannot read it.
  return c.json({ user: { id: row.id, email: row.email, name: row.name, avatar_bg: row.avatar_bg } })
})

authRoutes.post('/logout', (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ ok: true })
})
