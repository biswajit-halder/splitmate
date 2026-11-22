import { Hono } from 'hono'
import { ForbiddenError } from '../errors/AppError'
import { computeNet, simplifyDebts } from '../lib/balances'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

export const balanceRoutes = new Hono<AppEnv>()

balanceRoutes.use('*', requireAuth)

async function assertMember(c: Parameters<typeof requireAuth>[0], groupId: string) {
  const userId = c.get('userId')
  const membership = await c.env.DB.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?')
    .bind(groupId, userId)
    .first()
  if (!membership) throw new ForbiddenError('You are not a member of this group')
}

balanceRoutes.get('/balances', async (c) => {
  const userId = c.get('userId')
  const { DB } = c.env

  const rows = await DB.prepare(
    `SELECT g.id AS group_id, g.name AS group_name, g.icon, g.icon_bg, g.icon_color,
            COALESCE(SUM(CASE WHEN b.user_id = ? THEN b.net_amount_paise ELSE -b.net_amount_paise END), 0) AS net_paise
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id
     LEFT JOIN balances b ON b.group_id = g.id AND (b.user_id = ? OR b.counterpart_id = ?)
     WHERE gm.user_id = ?
     GROUP BY g.id`
  )
    .bind(userId, userId, userId, userId)
    .all<{ group_id: string; group_name: string; icon: string | null; icon_bg: string | null; icon_color: string | null; net_paise: number }>()

  const totalOwed = rows.results.filter((r) => r.net_paise > 0).reduce((a, r) => a + r.net_paise, 0)
  const totalOwe = rows.results.filter((r) => r.net_paise < 0).reduce((a, r) => a - r.net_paise, 0)

  // Pairwise positions across all groups: positive = they owe the user,
  // negative = the user owes them. Used by the dashboard's settle board.
  const relevant = await DB.prepare(
    'SELECT user_id, counterpart_id, net_amount_paise FROM balances WHERE user_id = ? OR counterpart_id = ?'
  )
    .bind(userId, userId)
    .all<{ user_id: string; counterpart_id: string; net_amount_paise: number }>()

  const pairwise = new Map<string, number>()
  for (const row of relevant.results) {
    if (row.user_id === userId) {
      pairwise.set(row.counterpart_id, (pairwise.get(row.counterpart_id) ?? 0) + row.net_amount_paise)
    } else {
      pairwise.set(row.user_id, (pairwise.get(row.user_id) ?? 0) - row.net_amount_paise)
    }
  }

  const counterpartIds = [...pairwise.keys()]
  const names = new Map<string, string>()
  if (counterpartIds.length > 0) {
    const placeholders = counterpartIds.map(() => '?').join(', ')
    const users = await DB.prepare(`SELECT id, name FROM users WHERE id IN (${placeholders})`)
      .bind(...counterpartIds)
      .all<{ id: string; name: string }>()
    for (const u of users.results) names.set(u.id, u.name)
  }

  const counterparties = [...pairwise.entries()]
    .filter(([, netPaise]) => netPaise !== 0)
    .map(([otherUserId, netPaise]) => ({
      userId: otherUserId,
      name: names.get(otherUserId) ?? 'Member',
      netPaise,
    }))
    .sort((a, b) => Math.abs(b.netPaise) - Math.abs(a.netPaise))

  const settledThisMonth = await DB.prepare(
    `SELECT COALESCE(SUM(amount_paise), 0) AS total FROM settlements
     WHERE status = 'completed' AND (payer_id = ? OR payee_id = ?)
       AND substr(created_at, 1, 7) = ?`
  )
    .bind(userId, userId, new Date().toISOString().slice(0, 7))
    .first<{ total: number }>()

  return c.json({
    netPaise: totalOwed - totalOwe,
    owedPaise: totalOwed,
    owePaise: totalOwe,
    settledPaise: settledThisMonth?.total ?? 0,
    groups: rows.results.map((r) => ({
      groupId: r.group_id,
      groupName: r.group_name,
      icon: r.icon,
      iconBg: r.icon_bg,
      iconColor: r.icon_color,
      netPaise: r.net_paise ?? 0,
    })),
    counterparties,
  })
})

balanceRoutes.get('/groups/:id/balances', async (c) => {
  const groupId = c.req.param('id')
  await assertMember(c, groupId)
  const { DB } = c.env

  const balances = await DB.prepare(
    'SELECT user_id, counterpart_id, net_amount_paise FROM balances WHERE group_id = ?'
  )
    .bind(groupId)
    .all<{ user_id: string; counterpart_id: string; net_amount_paise: number }>()

  const net = computeNet(balances.results)

  const members = await DB.prepare(
    `SELECT u.id, u.name, u.email, u.avatar_bg FROM group_members gm JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = ? AND gm.status = 'active'`
  )
    .bind(groupId)
    .all<{ id: string; name: string; email: string; avatar_bg: string | null }>()

  const memberBalances = members.results.map((m) => ({
    userId: m.id,
    name: m.name,
    email: m.email,
    avatarBg: m.avatar_bg,
    netPaise: net.get(m.id) ?? 0,
  }))

  // Pairwise position of the requesting user: positive means the other member
  // owes them, negative means they owe the other member. This is what the
  // UI needs to record a settlement in the correct direction.
  const userId = c.get('userId')
  const pairwise = new Map<string, number>()
  for (const row of balances.results) {
    if (row.user_id === userId) {
      pairwise.set(row.counterpart_id, (pairwise.get(row.counterpart_id) ?? 0) + row.net_amount_paise)
    } else if (row.counterpart_id === userId) {
      pairwise.set(row.user_id, (pairwise.get(row.user_id) ?? 0) - row.net_amount_paise)
    }
  }

  return c.json({
    members: memberBalances,
    sumPaise: memberBalances.reduce((a, m) => a + m.netPaise, 0),
    myBalances: [...pairwise.entries()].map(([otherUserId, netPaise]) => ({
      userId: otherUserId,
      netPaise,
    })),
  })
})

balanceRoutes.post('/groups/:id/simplify-debts', async (c) => {
  const groupId = c.req.param('id')
  await assertMember(c, groupId)
  const { DB } = c.env

  const balances = await DB.prepare(
    'SELECT user_id, counterpart_id, net_amount_paise FROM balances WHERE group_id = ?'
  )
    .bind(groupId)
    .all<{ user_id: string; counterpart_id: string; net_amount_paise: number }>()

  const net = computeNet(balances.results)
  const transactions = simplifyDebts(net)

  return c.json({ transactions })
})
