import { Hono } from 'hono'
import { z } from 'zod'
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/AppError'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'
import { newId, nowIso } from '../utils/ids'

const sendSchema = z.object({
  email: z.string().email(),
})

export const friendRoutes = new Hono<AppEnv>()

friendRoutes.use('*', requireAuth)

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

friendRoutes.get('/friends', async (c) => {
  const userId = c.get('userId')
  const { DB } = c.env

  const rows = await DB.prepare(
    `SELECT fr.id AS request_id, u.id, u.name, u.email, u.avatar_bg
     FROM friend_requests fr
     JOIN users u ON u.id = CASE WHEN fr.requester_id = ? THEN fr.addressee_id ELSE fr.requester_id END
     WHERE fr.status = 'accepted' AND (fr.requester_id = ? OR fr.addressee_id = ?)`
  )
    .bind(userId, userId, userId)
    .all<{ request_id: string; id: string; name: string; email: string; avatar_bg: string | null }>()

  const balances = await DB.prepare(
    `SELECT counterpart_id, SUM(net_amount_paise) AS total
     FROM (
       SELECT counterpart_id, net_amount_paise FROM balances WHERE user_id = ?
       UNION ALL
       SELECT user_id AS counterpart_id, -net_amount_paise FROM balances WHERE counterpart_id = ?
     )
     GROUP BY counterpart_id`
  )
    .bind(userId, userId)
    .all<{ counterpart_id: string; total: number }>()

  const balanceMap = new Map(balances.results.map((b) => [b.counterpart_id, b.total ?? 0]))

  const friends = rows.results.map((r) => {
    const balancePaise = balanceMap.get(r.id) ?? 0
    return {
      id: r.id,
      requestId: r.request_id,
      name: r.name,
      email: r.email,
      initials: initials(r.name),
      avatarBg: r.avatar_bg,
      balancePaise,
    }
  })
  return c.json({ friends })
})

friendRoutes.get('/friends/requests', async (c) => {
  const userId = c.get('userId')
  const { DB } = c.env

  const [incoming, outgoing] = await Promise.all([
    DB.prepare(
      `SELECT fr.id, fr.status, fr.created_at, u.id AS user_id, u.name, u.email
       FROM friend_requests fr JOIN users u ON u.id = fr.requester_id
       WHERE fr.addressee_id = ? AND fr.status = 'pending'`
    )
      .bind(userId)
      .all<{ id: string; status: string; created_at: string; user_id: string; name: string; email: string }>(),
    DB.prepare(
      `SELECT fr.id, fr.status, fr.created_at, u.id AS user_id, u.name, u.email
       FROM friend_requests fr JOIN users u ON u.id = fr.addressee_id
       WHERE fr.requester_id = ? AND fr.status = 'pending'`
    )
      .bind(userId)
      .all<{ id: string; status: string; created_at: string; user_id: string; name: string; email: string }>(),
  ])

  return c.json({
    incoming: incoming.results,
    outgoing: outgoing.results,
  })
})

friendRoutes.post('/friends/requests', async (c) => {
  const userId = c.get('userId')
  const body = sendSchema.parse(await c.req.json())
  const email = body.email.toLowerCase()
  const { DB } = c.env

  if (email === '') throw new BadRequestError('Email is required')
  const target = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>()
  if (!target) throw new NotFoundError('No user with that email')

  if (target.id === userId) throw new BadRequestError('You cannot send a friend request to yourself')

  const existing = await DB.prepare(
    `SELECT id, status FROM friend_requests
     WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`
  )
    .bind(userId, target.id, target.id, userId)
    .first<{ id: string; status: string }>()

  let id: string
  if (existing) {
    if (existing.status === 'accepted') throw new BadRequestError('Already friends')
    if (existing.status === 'pending') {
      throw new BadRequestError('A friend request already exists between you and this user')
    }
    // The previous request was rejected: re-open it instead of failing on the
    // UNIQUE(requester_id, addressee_id) constraint.
    id = existing.id
    await DB.prepare(
      "UPDATE friend_requests SET requester_id = ?, addressee_id = ?, status = 'pending', updated_at = ? WHERE id = ?"
    )
      .bind(userId, target.id, nowIso(), id)
      .run()
  } else {
    id = newId()
    await DB.prepare(
      'INSERT INTO friend_requests (id, requester_id, addressee_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(id, userId, target.id, 'pending', nowIso(), nowIso())
      .run()
  }

  await DB.prepare(
    'INSERT INTO notifications (id, user_id, title, body, type, ref_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(newId(), target.id, 'New friend request', 'Someone wants to connect', 'friend_request', id, 0, nowIso())
    .run()

  const targetName = await DB.prepare('SELECT name FROM users WHERE id = ?').bind(target.id).first<{ name: string }>()
  await DB.prepare(
    'INSERT INTO activity_events (id, user_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(newId(), userId, 'friend_request', JSON.stringify({ toUserId: target.id, toName: targetName?.name ?? '' }), nowIso())
    .run()

  return c.json({ request: { id } }, 201)
})

friendRoutes.post('/friends/requests/:id/accept', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const { DB } = c.env

  const request = await DB.prepare(
    'SELECT id, requester_id, addressee_id FROM friend_requests WHERE id = ? AND status = ?'
  )
    .bind(id, 'pending')
    .first<{ id: string; requester_id: string; addressee_id: string }>()
  if (!request) throw new NotFoundError('Friend request not found')
  if (request.addressee_id !== userId) throw new ForbiddenError('You cannot accept this request')

  await DB.batch([
    DB.prepare("UPDATE friend_requests SET status = 'accepted', updated_at = ? WHERE id = ?").bind(nowIso(), id),
    DB.prepare(
      'INSERT INTO notifications (id, user_id, title, body, type, ref_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(newId(), request.requester_id, 'Friend request accepted', 'You are now friends', 'friend_added', id, 0, nowIso()),
    DB.prepare(
      'INSERT INTO activity_events (id, user_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(newId(), request.addressee_id, 'friend_added', JSON.stringify({ friendUserId: request.requester_id }), nowIso()),
  ])

  return c.json({ ok: true })
})

friendRoutes.post('/friends/requests/:id/reject', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const { DB } = c.env

  const request = await DB.prepare('SELECT id, addressee_id FROM friend_requests WHERE id = ? AND status = ?')
    .bind(id, 'pending')
    .first<{ id: string; addressee_id: string }>()
  if (!request) throw new NotFoundError('Friend request not found')
  if (request.addressee_id !== userId) throw new ForbiddenError('You cannot reject this request')

  await DB.prepare("UPDATE friend_requests SET status = 'rejected', updated_at = ? WHERE id = ?")
    .bind(nowIso(), id)
    .run()
  return c.json({ ok: true })
})

friendRoutes.delete('/friends/requests/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const { DB } = c.env

  const request = await DB.prepare(
    'SELECT id, requester_id, status FROM friend_requests WHERE id = ?'
  )
    .bind(id)
    .first<{ id: string; requester_id: string; status: string }>()

  if (!request) throw new NotFoundError('Friend request not found')
  if (request.requester_id !== userId) throw new ForbiddenError('You can only cancel your own outgoing requests')
  if (request.status !== 'pending') throw new BadRequestError('Only pending requests can be cancelled')

  await DB.prepare('DELETE FROM friend_requests WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

friendRoutes.delete('/friends/:id', async (c) => {
  const userId = c.get('userId')
  const friendUserId = c.req.param('id')
  const { DB } = c.env

  if (friendUserId === userId) throw new BadRequestError('You cannot remove yourself')

  await DB.prepare(
    `DELETE FROM friend_requests
     WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`
  )
    .bind(userId, friendUserId, friendUserId, userId)
    .run()

  return c.json({ ok: true })
})
