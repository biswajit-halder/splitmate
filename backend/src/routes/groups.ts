import { Hono } from 'hono'
import { z } from 'zod'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../errors/AppError'
import { hashToken } from '../lib/auth'
import { assertGroupRole, getMemberRole } from '../lib/roles'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'
import { newId, nowIso } from '../utils/ids'

const createGroupSchema = z.object({
  name: z.string().min(1).max(80),
  icon: z.string().optional(),
  icon_bg: z.string().optional(),
  icon_color: z.string().optional(),
  type: z.string().optional(),
  currency: z.string().length(3).regex(/^[A-Z]+$/).optional(),
})

const patchGroupSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  icon: z.string().optional(),
  icon_bg: z.string().optional(),
  icon_color: z.string().optional(),
  type: z.string().optional(),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  photo: z.string().startsWith('data:image/').max(700000).optional(),
  removePhoto: z.boolean().optional(),
})

const inviteSchema = z.object({ email: z.string().email() })
const inviteLinkSchema = z.object({ maxUses: z.number().int().min(0).max(100).optional(), days: z.number().int().min(1).max(30).optional() })
const roleSchema = z.object({ role: z.enum(['admin', 'member']) })

export const groupRoutes = new Hono<AppEnv>()

groupRoutes.use('*', requireAuth)

async function getMembership(c: Parameters<typeof requireAuth>[0], groupId: string) {
  const userId = c.get('userId')
  return c.env.DB.prepare('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?')
    .bind(groupId, userId)
    .first<{ id: string; status: string; role: string }>()
}

async function assertMember(c: Parameters<typeof requireAuth>[0], groupId: string) {
  const membership = await getMembership(c, groupId)
  if (!membership) throw new ForbiddenError('You are not a member of this group')
  return membership
}

groupRoutes.get('/groups', async (c) => {
  const userId = c.get('userId')
  const { DB } = c.env
  const rows = await DB.prepare(
    `SELECT g.id, g.name, g.icon, g.icon_bg, g.icon_color, g.type, g.currency, g.accent, g.photo_key, g.created_by,
            gm.status AS membership_status, gm.role AS my_role,
            COALESCE(SUM(CASE WHEN b.user_id = ? THEN b.net_amount_paise ELSE -b.net_amount_paise END), 0) AS net_paise
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id
     LEFT JOIN balances b ON b.group_id = g.id AND (b.user_id = ? OR b.counterpart_id = ?)
     WHERE gm.user_id = ?
     GROUP BY g.id
     ORDER BY g.created_at DESC`
  )
    .bind(userId, userId, userId, userId)
    .all<{
      id: string
      name: string
      icon: string | null
      icon_bg: string | null
      icon_color: string | null
      type: string | null
      currency: string | null
      accent: string | null
      photo_key: string | null
      created_by: string
      membership_status: string
      my_role: string
      net_paise: number
    }>()

  const groups = rows.results.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    iconBg: g.icon_bg,
    iconColor: g.icon_color,
    type: g.type,
    currency: g.currency ?? 'INR',
    accent: g.accent,
    hasPhoto: !!g.photo_key,
    role: g.my_role ?? 'member',
    createdBy: g.created_by,
    balancePaise: g.net_paise ?? 0,
    memberCount: 0,
    members: [] as Array<{ initials: string; bgColor: string | null }>,
  }))

  for (const g of groups) {
    const members = await DB.prepare(
      `SELECT u.name, u.avatar_bg FROM group_members gm JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = ? AND gm.status = 'active'`
    )
      .bind(g.id)
      .all<{ name: string; avatar_bg: string | null }>()
    g.memberCount = members.results.length
    g.members = members.results.map((m) => ({
      initials: m.name
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      bgColor: m.avatar_bg,
    }))
  }

  return c.json({ groups })
})

groupRoutes.post('/groups', async (c) => {
  const userId = c.get('userId')
  const body = createGroupSchema.parse(await c.req.json())
  const { DB } = c.env
  const groupId = newId()
  const memberId = newId()

  await DB.batch([
    DB.prepare(
      'INSERT INTO groups (id, name, icon, icon_bg, icon_color, type, currency, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(groupId, body.name, body.icon ?? null, body.icon_bg ?? null, body.icon_color ?? null, body.type ?? null, body.currency ?? 'INR', userId, nowIso()),
    DB.prepare(
      "INSERT INTO group_members (id, group_id, user_id, status, role, joined_at) VALUES (?, ?, ?, 'active', 'owner', ?)"
    ).bind(memberId, groupId, userId, nowIso()),
    DB.prepare(
      'INSERT INTO activity_events (id, user_id, type, group_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(newId(), userId, 'group_created', groupId, JSON.stringify({ groupName: body.name }), nowIso()),
  ])

  return c.json({ group: { id: groupId, ...body, createdBy: userId } }, 201)
})

groupRoutes.get('/groups/:id', async (c) => {
  const groupId = c.req.param('id')
  await assertMember(c, groupId)
  const { DB } = c.env

  const group = await DB.prepare(
    `SELECT g.id, g.name, g.icon, g.icon_bg, g.icon_color, g.type, g.currency, g.accent, g.photo_key, g.created_by,
            u.name AS created_by_name
     FROM groups g JOIN users u ON u.id = g.created_by
     WHERE g.id = ?`
  )
    .bind(groupId)
    .first<{
      id: string
      name: string
      icon: string | null
      icon_bg: string | null
      icon_color: string | null
      type: string | null
      currency: string | null
      accent: string | null
      photo_key: string | null
      created_by: string
      created_by_name: string
    }>()
  if (!group) throw new NotFoundError('Group not found')

  const members = await DB.prepare(
    `SELECT gm.id AS membership_id, gm.status, gm.role, u.id AS user_id, u.name, u.email, u.avatar_bg
     FROM group_members gm JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = ?`
  )
    .bind(groupId)
    .all<{ membership_id: string; status: string; role: string; user_id: string; name: string; email: string; avatar_bg: string | null }>()

  return c.json({
    group: {
      id: group.id,
      name: group.name,
      icon: group.icon,
      iconBg: group.icon_bg,
      iconColor: group.icon_color,
      type: group.type,
      currency: group.currency ?? 'INR',
      accent: group.accent,
      photoKey: group.photo_key,
      role: await getMemberRole(c.env.DB, groupId, c.get('userId')),
      createdBy: group.created_by,
      createdByName: group.created_by_name,
      members: members.results.map(m => ({ ...m, role: m.role ?? 'member' })),
    },
  })
})

groupRoutes.patch('/groups/:id', async (c) => {
  const groupId = c.req.param('id')
  const userId = c.get('userId')
  const body = patchGroupSchema.parse(await c.req.json())

  const group = await c.env.DB.prepare('SELECT id, created_by FROM groups WHERE id = ?').bind(groupId).first<{
    id: string
    created_by: string
  }>()
  if (!group) throw new NotFoundError('Group not found')
  await assertGroupRole(c, groupId, 'owner', 'admin')

  await c.env.DB.prepare(
    `UPDATE groups SET name = COALESCE(?, name), icon = COALESCE(?, icon), icon_bg = COALESCE(?, icon_bg),
     icon_color = COALESCE(?, icon_color), type = COALESCE(?, type), accent = COALESCE(?, accent),
     photo_key = CASE WHEN ? = 1 THEN NULL ELSE COALESCE(?, photo_key) END WHERE id = ?`
  )
    .bind(body.name ?? null, body.icon ?? null, body.icon_bg ?? null, body.icon_color ?? null,
      body.type ?? null, body.accent ?? null, body.removePhoto ? 1 : 0, body.photo ?? null, groupId)
    .run()
  return c.json({ ok: true })
})

groupRoutes.delete('/groups/:id', async (c) => {
  const groupId = c.req.param('id')
  const userId = c.get('userId')
  const { DB } = c.env

  const group = await DB.prepare('SELECT id, created_by FROM groups WHERE id = ?').bind(groupId).first<{
    id: string
    created_by: string
  }>()
  if (!group) throw new NotFoundError('Group not found')
  if (group.created_by !== userId) throw new ForbiddenError('Only the group owner can delete this group')

  await DB.batch([
    DB.prepare(
      "DELETE FROM notifications WHERE type = 'settlement' AND ref_id IN (SELECT id FROM settlements WHERE group_id = ?)"
    ).bind(groupId),
    DB.prepare('DELETE FROM activity_events WHERE group_id = ?').bind(groupId),
    DB.prepare('DELETE FROM settlements WHERE group_id = ?').bind(groupId),
    DB.prepare('DELETE FROM balances WHERE group_id = ?').bind(groupId),
    DB.prepare('DELETE FROM expense_splits WHERE expense_id IN (SELECT id FROM expenses WHERE group_id = ?)').bind(groupId),
    DB.prepare('DELETE FROM expenses WHERE group_id = ?').bind(groupId),
    DB.prepare('DELETE FROM group_members WHERE group_id = ?').bind(groupId),
    DB.prepare('DELETE FROM groups WHERE id = ?').bind(groupId),
  ])

  return c.json({ ok: true })
})

groupRoutes.post('/groups/:id/invite', async (c) => {
  const groupId = c.req.param('id')
  const body = inviteSchema.parse(await c.req.json())
  const email = body.email.toLowerCase()
  await assertGroupRole(c, groupId, 'owner', 'admin')
  const { DB } = c.env

  const existing = await DB.prepare(
    'SELECT id, status, user_id FROM group_members WHERE group_id = ? AND email = ?'
  )
    .bind(groupId, email)
    .first<{ id: string; status: string; user_id: string | null }>()
  if (existing) {
    if (existing.user_id) {
      throw new ConflictError('This person is already a member of the group')
    }
    throw new ForbiddenError('Invite already pending for this email')
  }

  const id = newId()
  await DB.prepare(
    "INSERT INTO group_members (id, group_id, email, status, joined_at) VALUES (?, ?, ?, 'pending', ?)"
  )
    .bind(id, groupId, email, nowIso())
    .run()
  return c.json({ invite: { id, email } }, 201)
})

groupRoutes.post('/groups/:id/join', async (c) => {
  const groupId = c.req.param('id')
  const userId = c.get('userId')
  const { DB } = c.env

  const me = await DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>()
  if (!me) throw new NotFoundError('User not found')

  const invite = await DB.prepare(
    "SELECT id FROM group_members WHERE group_id = ? AND email = ? AND user_id IS NULL AND status = 'pending'"
  )
    .bind(groupId, me.email)
    .first<{ id: string }>()
  if (!invite) throw new ForbiddenError('No pending invite for your email')

  await DB.prepare("UPDATE group_members SET user_id = ?, status = 'active', joined_at = ? WHERE id = ?")
    .bind(userId, nowIso(), invite.id)
    .run()
  await DB.prepare(
    'INSERT INTO activity_events (id, user_id, type, group_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(newId(), userId, 'group_joined', groupId, JSON.stringify({}), nowIso())
    .run()

  return c.json({ ok: true })
})

groupRoutes.post('/groups/:id/leave', async (c) => {
  const groupId = c.req.param('id')
  const userId = c.get('userId')
  const { DB } = c.env

  const membership = await getMembership(c, groupId)
  if (!membership) throw new ForbiddenError('You are not a member of this group')

  const hasBalance = await DB.prepare(
    'SELECT 1 FROM balances WHERE group_id = ? AND (user_id = ? OR counterpart_id = ?) AND net_amount_paise != 0 LIMIT 1'
  )
    .bind(groupId, userId, userId)
    .first()
  if (hasBalance) throw new ForbiddenError('Cannot leave: you have outstanding balances in this group')

  await DB.batch([
    DB.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?').bind(groupId, userId),
    DB.prepare('DELETE FROM balances WHERE group_id = ? AND (user_id = ? OR counterpart_id = ?)').bind(groupId, userId, userId),
  ])

  return c.json({ ok: true })
})

groupRoutes.delete('/groups/:id/members/:userId', async (c) => {
  const groupId = c.req.param('id')
  const targetUserId = c.req.param('userId')
  const userId = c.get('userId')
  const { DB } = c.env

  const group = await DB.prepare('SELECT id, created_by FROM groups WHERE id = ?').bind(groupId).first<{
    id: string
    created_by: string
  }>()
  if (!group) throw new NotFoundError('Group not found')
  await assertGroupRole(c, groupId, 'owner', 'admin')
  if (targetUserId === userId) throw new ForbiddenError('You cannot remove yourself this way — leave the group instead')
  const targetRole = await getMemberRole(DB, groupId, targetUserId)
  if (targetRole === 'owner') throw new ForbiddenError('The group owner cannot be removed')

  const targetMembership = await DB.prepare(
    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?'
  )
    .bind(groupId, targetUserId)
    .first<{ id: string }>()
  if (!targetMembership) throw new NotFoundError('User is not a member of this group')

  const hasBalance = await DB.prepare(
    'SELECT 1 FROM balances WHERE group_id = ? AND (user_id = ? OR counterpart_id = ?) AND net_amount_paise != 0 LIMIT 1'
  )
    .bind(groupId, targetUserId, targetUserId)
    .first()
  if (hasBalance) throw new ForbiddenError('Cannot remove: user has outstanding balances in this group')

  await DB.batch([
    DB.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?').bind(groupId, targetUserId),
    DB.prepare('DELETE FROM balances WHERE group_id = ? AND (user_id = ? OR counterpart_id = ?)').bind(groupId, targetUserId, targetUserId),
  ])

  return c.json({ ok: true })
})

/* ---------- Shareable invite links ---------- */

groupRoutes.post('/groups/:id/invite-links', async (c) => {
  const groupId = c.req.param('id')
  await assertGroupRole(c, groupId, 'owner', 'admin')
  const body = inviteLinkSchema.parse(await c.req.json().catch(() => ({})))
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
  const expires = new Date(Date.now() + (body.days ?? 7) * 86400000).toISOString()

  await c.env.DB.prepare(
    `INSERT INTO group_invites (id, group_id, token_hash, created_by, expires_at, max_uses, uses, revoked, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)`
  )
    .bind(newId(), groupId, await hashToken(token), c.get('userId'), expires, body.maxUses ?? 0, nowIso())
    .run()

  return c.json({ url: `${c.env.APP_ORIGIN}/join?token=${encodeURIComponent(token)}`, expiresAt: expires }, 201)
})

groupRoutes.get('/groups/:id/invite-links', async (c) => {
  const groupId = c.req.param('id')
  await assertGroupRole(c, groupId, 'owner', 'admin')
  const rows = await c.env.DB.prepare(
    'SELECT id, expires_at, max_uses, uses, revoked FROM group_invites WHERE group_id = ? ORDER BY created_at DESC'
  )
    .bind(groupId)
    .all<{ id: string; expires_at: string; max_uses: number; uses: number; revoked: number }>()
  return c.json({
    links: rows.results.map(r => ({ id: r.id, expiresAt: r.expires_at, maxUses: r.max_uses, uses: r.uses, revoked: !!r.revoked })),
  })
})

groupRoutes.delete('/groups/:id/invite-links/:linkId', async (c) => {
  const groupId = c.req.param('id')
  await assertGroupRole(c, groupId, 'owner', 'admin')
  await c.env.DB.prepare('UPDATE group_invites SET revoked = 1 WHERE id = ? AND group_id = ?')
    .bind(c.req.param('linkId'), groupId)
    .run()
  return c.json({ ok: true })
})

/** Join using a shareable link token. Requires an authenticated user. */
groupRoutes.post('/groups/join-by-link', async (c) => {
  const body = z.object({ token: z.string().min(10) }).parse(await c.req.json())
  const userId = c.get('userId')
  const { DB } = c.env
  const invite = await DB.prepare(
    'SELECT id, group_id, expires_at, max_uses, uses, revoked FROM group_invites WHERE token_hash = ?'
  )
    .bind(await hashToken(body.token))
    .first<{ id: string; group_id: string; expires_at: string; max_uses: number; uses: number; revoked: number }>()

  if (!invite || invite.revoked || new Date(invite.expires_at).getTime() < Date.now() ||
      (invite.max_uses > 0 && invite.uses >= invite.max_uses)) {
    throw new BadRequestError('This invite link is invalid or has expired')
  }

  const existing = await DB.prepare(
    "SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'"
  )
    .bind(invite.group_id, userId)
    .first()
  if (!existing) {
    await DB.batch([
      DB.prepare(
        "INSERT INTO group_members (id, group_id, user_id, status, role, joined_at) VALUES (?, ?, ?, 'active', 'member', ?)"
      ).bind(newId(), invite.group_id, userId, nowIso()),
      DB.prepare('UPDATE group_invites SET uses = uses + 1 WHERE id = ?').bind(invite.id),
    ])
  }
  return c.json({ groupId: invite.group_id })
})

/* ---------- Roles & group photo ---------- */

groupRoutes.patch('/groups/:id/members/:userId', async (c) => {
  const groupId = c.req.param('id')
  await assertGroupRole(c, groupId, 'owner')
  const target = c.req.param('userId')
  const { role } = roleSchema.parse(await c.req.json())
  const current = await getMemberRole(c.env.DB, groupId, target)
  if (!current || current === 'owner') throw new ForbiddenError('Cannot change this member’s role')
  await c.env.DB.prepare('UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?')
    .bind(role, groupId, target)
    .run()
  return c.json({ ok: true })
})

/** Authenticated image endpoint — stored as a data URL for simple deployments. */
groupRoutes.get('/groups/:id/photo', async (c) => {
  const groupId = c.req.param('id')
  await assertMember(c, groupId)
  const group = await c.env.DB.prepare('SELECT photo_key FROM groups WHERE id = ?')
    .bind(groupId)
    .first<{ photo_key: string | null }>()
  if (!group?.photo_key || !group.photo_key.startsWith('data:image/')) throw new NotFoundError('No group photo')
  const [header, encoded] = group.photo_key.split(',')
  const mime = header.replace('data:', '').replace(';base64', '')
  const bytes = Uint8Array.from(atob(encoded ?? ''), ch => ch.charCodeAt(0))
  return c.body(bytes, 200, { 'Content-Type': mime, 'Cache-Control': 'private, max-age=3600' })
})
