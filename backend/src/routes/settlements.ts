import { Hono } from 'hono'
import { z } from 'zod'
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/AppError'
import { computeNet, simplifyDebts, type BalanceRow } from '../lib/balances'
import { assertActiveMembers } from '../lib/membership'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'
import { newId, nowIso } from '../utils/ids'

const createSettlementSchema = z.object({
  payerId: z.string().min(1),
  payeeId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  method: z.string().optional(),
  note: z.string().optional(),
})

export const settlementRoutes = new Hono<AppEnv>()

settlementRoutes.use('*', requireAuth)

async function assertMember(c: Parameters<typeof requireAuth>[0], groupId: string) {
  const userId = c.get('userId')
  const membership = await c.env.DB.prepare(
    "SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'"
  )
    .bind(groupId, userId)
    .first()
  if (!membership) throw new ForbiddenError('You are not an active member of this group')
}

settlementRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const { DB } = c.env

  const rows = await DB.prepare(
    `SELECT s.id, s.group_id, s.payer_id, s.payee_id, s.amount_paise, s.method, s.status, s.note, s.created_at,
            g.name AS group_name,
            pu.name AS payer_name, eu.name AS payee_name
     FROM settlements s
     JOIN groups g ON g.id = s.group_id
     JOIN users pu ON pu.id = s.payer_id
     JOIN users eu ON eu.id = s.payee_id
     WHERE s.payer_id = ? OR s.payee_id = ?
     ORDER BY s.created_at DESC`
  )
    .bind(userId, userId)
    .all<{
      id: string
      group_id: string
      group_name: string
      payer_id: string
      payer_name: string
      payee_id: string
      payee_name: string
      amount_paise: number
      method: string | null
      status: string
      note: string | null
      created_at: string
    }>()

  return c.json({
    settlements: rows.results.map((r) => ({
      id: r.id,
      groupId: r.group_id,
      groupName: r.group_name,
      fromUserId: r.payer_id,
      fromUserName: r.payer_name,
      toUserId: r.payee_id,
      toUserName: r.payee_name,
      amountPaise: r.amount_paise,
      method: r.method,
      note: r.note,
      status: r.status,
      createdAt: r.created_at,
    })),
  })
})

settlementRoutes.get('/groups/:id/settlements', async (c) => {
  const groupId = c.req.param('id')
  await assertMember(c, groupId)
  const { DB } = c.env
  const status = c.req.query('status')

  let sql =
    `SELECT s.id, s.payer_id, s.payee_id, s.amount_paise, s.method, s.status, s.note, s.created_at,
            pu.name AS payer_name, eu.name AS payee_name
     FROM settlements s
     JOIN users pu ON pu.id = s.payer_id
     JOIN users eu ON eu.id = s.payee_id
     WHERE s.group_id = ?`
  const args: Array<string | number> = [groupId]
  if (status) {
    sql += ' AND s.status = ?'
    args.push(status)
  }
  sql += ' ORDER BY s.created_at DESC'

  const rows = await DB.prepare(sql)
    .bind(...args)
    .all<{
      id: string
      payer_id: string
      payee_id: string
      amount_paise: number
      method: string | null
      status: string
      note: string | null
      created_at: string
      payer_name: string
      payee_name: string
    }>()
  return c.json({ settlements: rows.results })
})

/**
 * Amount the payer still owes the payee in this group (0 when the payer owes
 * nothing). Pending settlements are already accounted for so the same debt
 * cannot be scheduled twice.
 */
async function getOutstandingPaise(
  db: D1Database,
  groupId: string,
  payerId: string,
  payeeId: string
): Promise<number> {
  const rows = await db
    .prepare(
      `SELECT user_id, counterpart_id, net_amount_paise FROM balances
       WHERE group_id = ? AND ((user_id = ? AND counterpart_id = ?) OR (user_id = ? AND counterpart_id = ?))`
    )
    .bind(groupId, payerId, payeeId, payeeId, payerId)
    .all<BalanceRow>()

  // computeNet returns the payer's net position with the payee: negative
  // means the payer owes the payee.
  const net = computeNet(rows.results).get(payerId) ?? 0
  const outstanding = Math.max(0, -net)

  const pending = await db
    .prepare(
      `SELECT COALESCE(SUM(amount_paise), 0) AS total FROM settlements
       WHERE group_id = ? AND status = 'pending' AND payer_id = ? AND payee_id = ?`
    )
    .bind(groupId, payerId, payeeId)
    .first<{ total: number }>()

  return Math.max(0, outstanding - (pending?.total ?? 0))
}

/**
 * Create settlements for every simplified transfer in one batch. The caller's
 * own side is auto-confirmed; other parties still need to confirm theirs.
 */
settlementRoutes.post('/groups/:id/settlements/settle-all', async (c) => {
  const groupId = c.req.param('id')
  await assertMember(c, groupId)
  const userId = c.get('userId')
  const { DB } = c.env

  const rows = await DB.prepare(
    'SELECT user_id, counterpart_id, net_amount_paise FROM balances WHERE group_id = ?'
  ).bind(groupId).all<BalanceRow>()
  const net = computeNet(rows.results)

  // Pending settlements will reduce their payer's obligation once confirmed.
  const pending = await DB.prepare(
    "SELECT payer_id, amount_paise FROM settlements WHERE group_id = ? AND status = 'pending'"
  ).bind(groupId).all<{ payer_id: string; amount_paise: number }>()
  for (const p of pending.results) {
    net.set(p.payer_id, (net.get(p.payer_id) ?? 0) + p.amount_paise)
  }

  const transfers = simplifyDebts(net).filter(t => t.amountPaise > 0)
  if (transfers.length === 0) throw new BadRequestError('There is nothing to settle in this group')

  const statements: D1PreparedStatement[] = []
  for (const t of transfers) {
    const id = newId()
    const payerConfirmed = t.from === userId ? 1 : 0
    const payeeConfirmed = t.to === userId ? 1 : 0
    statements.push(
      DB.prepare(
        `INSERT INTO settlements (id, group_id, payer_id, payee_id, amount_paise, method, status, payer_confirmed, payee_confirmed, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, 'pending', ?, ?, ?, ?)`
      ).bind(id, groupId, t.from, t.to, t.amountPaise, payerConfirmed, payeeConfirmed, nowIso(), nowIso())
    )
    if (t.to !== userId) {
      statements.push(
        DB.prepare(
          'INSERT INTO notifications (id, user_id, title, body, type, ref_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)'
        ).bind(newId(), t.to, 'Settlement awaiting confirmation', 'Confirm this settlement', 'settlement', id, nowIso())
      )
    }
  }
  await DB.batch(statements)
  return c.json({ created: transfers.length }, 201)
})

settlementRoutes.post('/groups/:id/settlements', async (c) => {
  const groupId = c.req.param('id')
  await assertMember(c, groupId)
  const body = createSettlementSchema.parse(await c.req.json())
  const { DB } = c.env

  if (body.payerId === body.payeeId) throw new ForbiddenError('Payer and payee must differ')
  await assertActiveMembers(c.env.DB, groupId, [body.payerId, body.payeeId], 'settlement parties')

  // A settlement must clear an actual debt in the right direction; otherwise
  // it would create a new one.
  const outstanding = await getOutstandingPaise(c.env.DB, groupId, body.payerId, body.payeeId)
  if (outstanding <= 0) {
    throw new BadRequestError('There is no outstanding debt between these members to settle')
  }
  if (body.amountPaise > outstanding) {
    throw new BadRequestError(
      `Settlement exceeds the outstanding balance of ${outstanding} paise`
    )
  }

  const id = newId()
  await DB.prepare(
    `INSERT INTO settlements (id, group_id, payer_id, payee_id, amount_paise, method, status, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  )
    .bind(id, groupId, body.payerId, body.payeeId, body.amountPaise, body.method ?? null, body.note ?? null, nowIso(), nowIso())
    .run()

  await DB.prepare(
    'INSERT INTO notifications (id, user_id, title, body, type, ref_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(newId(), body.payeeId, 'Settlement awaiting confirmation', 'Confirm this settlement', 'settlement', id, 0, nowIso())
    .run()

  return c.json({ settlement: { id } }, 201)
})

settlementRoutes.post('/settlements/:id/confirm', async (c) => {
  const settlementId = c.req.param('id')
  const userId = c.get('userId')
  const { DB } = c.env

  const settlement = await DB.prepare(
    'SELECT * FROM settlements WHERE id = ?'
  )
    .bind(settlementId)
    .first<{
      id: string
      group_id: string
      payer_id: string
      payee_id: string
      amount_paise: number
      status: string
      payer_confirmed: number
      payee_confirmed: number
    }>()
  if (!settlement) throw new NotFoundError('Settlement not found')
  if (settlement.status === 'completed') throw new ForbiddenError('Settlement already completed')
  if (settlement.payer_id !== userId && settlement.payee_id !== userId) {
    throw new ForbiddenError('You cannot confirm this settlement')
  }

  const payerConfirmed = settlement.payer_confirmed === 1 || settlement.payer_id === userId ? 1 : 0
  const payeeConfirmed = settlement.payee_confirmed === 1 || settlement.payee_id === userId ? 1 : 0
  const completed = payerConfirmed === 1 && payeeConfirmed === 1
  const now = nowIso()

  const statements: D1PreparedStatement[] = [
    DB.prepare(
      'UPDATE settlements SET payer_confirmed = ?, payee_confirmed = ?, status = ?, updated_at = ? WHERE id = ?'
    ).bind(payerConfirmed, payeeConfirmed, completed ? 'completed' : 'pending', now, settlementId),
  ]

  if (completed) {
    // The payer (debtor) hands money to the payee (creditor), so the payer's
    // debt shrinks: credit the payer / debit the payee. A row
    // (user_id = payer, counterpart_id = payee, net = +amount) means
    // "the payee's claim against the payer is reduced by amount" once it is
    // netted with the original (payee -> payer) expense row.
    statements.push(
      DB.prepare(
        `INSERT INTO balances (id, group_id, user_id, counterpart_id, net_amount_paise, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_id, user_id, counterpart_id)
         DO UPDATE SET net_amount_paise = net_amount_paise + excluded.net_amount_paise, updated_at = excluded.updated_at`
      ).bind(newId(), settlement.group_id, settlement.payer_id, settlement.payee_id, settlement.amount_paise, now)
    )
    statements.push(
      DB.prepare(
        'INSERT INTO activity_events (id, user_id, type, group_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(newId(), settlement.payer_id, 'settlement_made', settlement.group_id, JSON.stringify({ settlementId, amountPaise: settlement.amount_paise }), now)
    )
    statements.push(
      DB.prepare(
        'INSERT INTO activity_events (id, user_id, type, group_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(newId(), settlement.payee_id, 'settlement_received', settlement.group_id, JSON.stringify({ settlementId, amountPaise: settlement.amount_paise }), now)
    )
  }

  await DB.batch(statements)
  return c.json({ settlement: { id: settlementId, status: completed ? 'completed' : 'pending' } })
})

settlementRoutes.delete('/settlements/:id', async (c) => {
  const settlementId = c.req.param('id')
  const userId = c.get('userId')
  const { DB } = c.env

  const settlement = await DB.prepare('SELECT id, payer_id, payee_id, status FROM settlements WHERE id = ?')
    .bind(settlementId)
    .first<{ id: string; payer_id: string; payee_id: string; status: string }>()
  if (!settlement) throw new NotFoundError('Settlement not found')
  if (settlement.payer_id !== userId && settlement.payee_id !== userId) {
    throw new ForbiddenError('You cannot delete this settlement')
  }
  if (settlement.status !== 'pending') throw new ForbiddenError('Only pending settlements can be deleted')

  await DB.prepare('DELETE FROM settlements WHERE id = ?').bind(settlementId).run()
  return c.json({ ok: true })
})
