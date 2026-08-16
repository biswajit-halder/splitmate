import { Hono } from 'hono'
import { z } from 'zod'
import { BadRequestError } from '../errors/AppError'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

const VALID_TYPES = [
  'expense_added',
  'expense_edited',
  'settlement_made',
  'settlement_received',
  'group_created',
  'group_joined',
  'friend_added',
  'friend_request',
] as const

const querySchema = z.object({
  type: z.enum(VALID_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export const activityRoutes = new Hono<AppEnv>()

activityRoutes.use('*', requireAuth)

activityRoutes.get('/activity', async (c) => {
  const userId = c.get('userId')
  const parsed = querySchema.safeParse(c.req.query())
  if (!parsed.success) throw new BadRequestError('Invalid query parameters')
  const { type, page, limit } = parsed.data
  const offset = (page - 1) * limit
  const { DB } = c.env

  let where = '(a.user_id = ? OR a.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?))'
  const args: Array<string | number> = [userId, userId]
  if (type) {
    where += ' AND a.type = ?'
    args.push(type)
  }

  const rows = await DB.prepare(
    `SELECT a.id, a.user_id, a.type, a.group_id, a.payload, a.created_at, u.name AS actor_name
     FROM activity_events a
     JOIN users u ON u.id = a.user_id
     WHERE ${where}
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...args, limit, offset)
    .all<{
      id: string
      user_id: string
      type: string
      group_id: string | null
      payload: string | null
      created_at: string
      actor_name: string
    }>()

  const events = rows.results.map((r) => ({
    id: r.id,
    actorId: r.user_id,
    actorName: r.actor_name,
    type: r.type,
    groupId: r.group_id,
    payload: r.payload ? JSON.parse(r.payload) : null,
    createdAt: r.created_at,
  }))

  return c.json({ events, page, limit, hasMore: rows.results.length === limit })
})
