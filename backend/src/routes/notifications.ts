import { Hono } from 'hono'
import { ForbiddenError, NotFoundError } from '../errors/AppError'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'
import { nowIso } from '../utils/ids'

export const notificationRoutes = new Hono<AppEnv>()

notificationRoutes.use('*', requireAuth)

notificationRoutes.get('/notifications', async (c) => {
  const userId = c.get('userId')
  const rows = await c.env.DB.prepare(
    'SELECT id, title, body, type, ref_id, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
  )
    .bind(userId)
    .all<{ id: string; title: string; body: string | null; type: string | null; ref_id: string | null; is_read: number; created_at: string }>()

  const unread = rows.results.filter((n) => n.is_read === 0).length
  return c.json({
    notifications: rows.results,
    unread,
  })
})

notificationRoutes.post('/notifications/read', async (c) => {
  const userId = c.get('userId')
  await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
    .bind(userId)
    .run()
  return c.json({ ok: true })
})

notificationRoutes.post('/notifications/:id/read', async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')
  const { DB } = c.env

  const notification = await DB.prepare('SELECT id, user_id FROM notifications WHERE id = ?')
    .bind(id)
    .first<{ id: string; user_id: string }>()
  if (!notification) throw new NotFoundError('Notification not found')
  if (notification.user_id !== userId) throw new ForbiddenError('You cannot access this notification')

  await DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
