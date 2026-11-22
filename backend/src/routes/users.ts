import { Hono } from 'hono'
import { z } from 'zod'
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors/AppError'
import { hashPassword, verifyPassword } from '../lib/auth'
import { requireAuth } from '../middleware/auth'
import { loginRateLimit } from '../middleware/rateLimit'
import type { AppEnv } from '../types'
import { nowIso } from '../utils/ids'

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  avatar_bg: z.string().optional(),
  digest_enabled: z.boolean().optional(),
})

const changeEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export const userRoutes = new Hono<AppEnv>()

userRoutes.use('*', requireAuth)

userRoutes.get('/me', async (c) => {
  const userId = c.get('userId')
  const row = await c.env.DB.prepare('SELECT id, email, name, avatar_bg FROM users WHERE id = ?')
    .bind(userId)
    .first<{ id: string; email: string; name: string; avatar_bg: string | null }>()
  if (!row) throw new NotFoundError('User not found')
  return c.json({ user: row })
})

userRoutes.patch('/me', async (c) => {
  const userId = c.get('userId')
  const body = patchSchema.parse(await c.req.json())
  const current = await c.env.DB.prepare('SELECT name, avatar_bg FROM users WHERE id = ?').bind(userId).first<{
    name: string
    avatar_bg: string | null
  }>()
  if (!current) throw new NotFoundError('User not found')
  const name = body.name ?? current.name
  const avatarBg = body.avatar_bg ?? current.avatar_bg
  await c.env.DB.prepare('UPDATE users SET name = ?, avatar_bg = ?, digest_enabled = COALESCE(?, digest_enabled), updated_at = ? WHERE id = ?')
    .bind(name, avatarBg, body.digest_enabled === undefined ? null : (body.digest_enabled ? 1 : 0), nowIso(), userId)
    .run()
  return c.json({ user: { id: userId, name, avatar_bg: avatarBg } })
})

/** Change the account email. Requires the current password as confirmation. */
userRoutes.post('/me/email', loginRateLimit, async (c) => {
  const userId = c.get('userId')
  const body = changeEmailSchema.parse(await c.req.json())
  const { DB } = c.env
  const email = body.email.toLowerCase()

  const row = await DB.prepare('SELECT id, email, password_hash FROM users WHERE id = ?')
    .bind(userId)
    .first<{ id: string; email: string; password_hash: string }>()
  if (!row) throw new NotFoundError('User not found')
  if (!(await verifyPassword(body.password, row.password_hash))) {
    throw new UnauthorizedError('Current password is incorrect')
  }
  if (email === row.email) {
    return c.json({ user: { id: row.id, email: row.email } })
  }

  const taken = await DB.prepare('SELECT id FROM users WHERE email = ? AND id != ?').bind(email, userId).first()
  if (taken) throw new ConflictError('Email is already in use')

  await DB.prepare('UPDATE users SET email = ?, updated_at = ? WHERE id = ?')
    .bind(email, nowIso(), userId)
    .run()
  return c.json({ user: { id: row.id, email } })
})

/** Change the account password. Requires the current password as confirmation. */
userRoutes.post('/me/password', loginRateLimit, async (c) => {
  const userId = c.get('userId')
  const body = changePasswordSchema.parse(await c.req.json())
  const { DB } = c.env

  const row = await DB.prepare('SELECT id, password_hash FROM users WHERE id = ?')
    .bind(userId)
    .first<{ id: string; password_hash: string }>()
  if (!row) throw new NotFoundError('User not found')
  if (!(await verifyPassword(body.currentPassword, row.password_hash))) {
    throw new UnauthorizedError('Current password is incorrect')
  }

  const passwordHash = await hashPassword(body.newPassword)
  // Bump the version so every previously issued token stops working.
  await DB.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1, updated_at = ? WHERE id = ?')
    .bind(passwordHash, nowIso(), userId)
    .run()
  return c.json({ user: { id: row.id } })
})
