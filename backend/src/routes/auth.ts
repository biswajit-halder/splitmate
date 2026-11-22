import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { BadRequestError, ConflictError, UnauthorizedError } from '../errors/AppError'
import { hashPassword, hashToken, signToken, verifyPassword } from '../lib/auth'
import { sendEmail } from '../lib/email'
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

const forgotSchema = z.object({ email: z.string().email() })
const resetSchema = z.object({ token: z.string().min(10), password: z.string().min(8) })

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

  const token = await signToken({ sub: id, email: body.email.toLowerCase(), ver: 0 }, c.env.JWT_SECRET)
  setSessionCookie(c, token, body.remember ? 2592000 : undefined)
  return c.json({ user: { id, email: body.email.toLowerCase(), name: body.name, avatar_bg: body.avatar_bg ?? null } }, 201)
})

authRoutes.post('/login', loginRateLimit, async (c) => {
  const body = loginSchema.parse(await c.req.json())
  const { DB } = c.env
  const row = await DB.prepare(
    'SELECT id, email, name, avatar_bg, password_hash, token_version FROM users WHERE email = ?'
  )
    .bind(body.email.toLowerCase())
    .first<{
      id: string
      email: string
      name: string
      avatar_bg: string | null
      password_hash: string
      token_version: number
    }>()
  if (!row || !(await verifyPassword(body.password, row.password_hash))) {
    throw new UnauthorizedError('Invalid email or password')
  }
  const token = await signToken(
    { sub: row.id, email: row.email, ver: row.token_version ?? 0 },
    c.env.JWT_SECRET
  )
  setSessionCookie(c, token, body.remember ? 2592000 : undefined)
  return c.json({ user: { id: row.id, email: row.email, name: row.name, avatar_bg: row.avatar_bg } })
})

authRoutes.post('/logout', (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ ok: true })
})

/** Request a password reset. Always returns ok to avoid account enumeration. */
authRoutes.post('/forgot-password', loginRateLimit, async (c) => {
  const { email } = forgotSchema.parse(await c.req.json())
  const { DB } = c.env
  const user = await DB.prepare('SELECT id, email FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first<{ id: string; email: string }>()

  if (user) {
    await DB.prepare('DELETE FROM password_resets WHERE user_id = ? AND used = 0').bind(user.id).run()
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    await DB.prepare(
      'INSERT INTO password_resets (id, user_id, token_hash, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)'
    )
      .bind(newId(), user.id, await hashToken(token), expires, nowIso())
      .run()

    const link = `${c.env.APP_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`
    const sent = await sendEmail(
      c.env,
      user.email,
      'Reset your SplitMate password',
      `Use this link to reset your password (valid for 30 minutes):\n${link}\n\nIf you did not request this, ignore this email.`
    )
    if (!sent && c.env.DEV_RESET_TOKEN === 'true') {
      return c.json({ ok: true, devToken: token })
    }
  }
  return c.json({ ok: true })
})

/** Complete a password reset and invalidate every existing session. */
authRoutes.post('/reset-password', loginRateLimit, async (c) => {
  const body = resetSchema.parse(await c.req.json())
  const { DB } = c.env
  const tokenHash = await hashToken(body.token)
  const reset = await DB.prepare(
    'SELECT id, user_id, expires_at, used FROM password_resets WHERE token_hash = ?'
  )
    .bind(tokenHash)
    .first<{ id: string; user_id: string; expires_at: string; used: number }>()

  if (!reset || reset.used !== 0 || new Date(reset.expires_at).getTime() < Date.now()) {
    throw new BadRequestError('Invalid or expired reset link')
  }

  const passwordHash = await hashPassword(body.password)
  await DB.batch([
    DB.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1, updated_at = ? WHERE id = ?')
      .bind(passwordHash, nowIso(), reset.user_id),
    DB.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').bind(reset.id),
    DB.prepare('DELETE FROM password_resets WHERE user_id = ? AND used = 0').bind(reset.user_id),
  ])
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ ok: true })
})
