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

  return c.json({
    netPaise: totalOwed - totalOwe,
    owedPaise: totalOwed,
    owePaise: totalOwe,
    groups: rows.results.map((r) => ({
      groupId: r.group_id,
      groupName: r.group_name,
      icon: r.icon,
      iconBg: r.icon_bg,
      iconColor: r.icon_color,
      netPaise: r.net_paise ?? 0,
    })),
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

  return c.json({ members: memberBalances, sumPaise: memberBalances.reduce((a, m) => a + m.netPaise, 0) })
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
