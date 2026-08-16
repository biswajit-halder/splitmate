import { Hono } from 'hono'
import { z } from 'zod'
import { NotFoundError } from '../errors/AppError'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'
import { nowIso } from '../utils/ids'

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  avatar_bg: z.string().optional(),
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
  await c.env.DB.prepare('UPDATE users SET name = ?, avatar_bg = ?, updated_at = ? WHERE id = ?')
    .bind(name, avatarBg, nowIso(), userId)
    .run()
  return c.json({ user: { id: userId, name, avatar_bg: avatarBg } })
})
