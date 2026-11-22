import { Hono } from 'hono'
import { z } from 'zod'
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/AppError'
import { assertActiveMembers } from '../lib/membership'
import { getMemberRole } from '../lib/roles'
import { computeSplits } from '../lib/splits'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'
import { newId, nowIso, todayStr } from '../utils/ids'

const splitModeSchema = z.enum(['equally', 'exact', 'percent', 'shares'])

const participantSchema = z.object({
  userId: z.string().min(1),
  amountPaise: z.number().int().nonnegative().optional(),
  weight: z.number().int().nonnegative().optional(),
  shares: z.number().int().positive().optional(),
})

const createExpenseSchema = z.object({
  description: z.string().min(1).max(200),
  amountPaise: z.number().int().positive(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paidBy: z.string().min(1),
  splitMode: splitModeSchema,
  participants: z.array(participantSchema).min(1),
  category: z.string().optional(),
})

const patchExpenseSchema = createExpenseSchema.partial().extend({
  description: z.string().min(1).max(200).optional(),
  amountPaise: z.number().int().positive().optional(),
  splitMode: splitModeSchema.optional(),
  participants: z.array(participantSchema).min(1).optional(),
})

export const expenseRoutes = new Hono<AppEnv>()

expenseRoutes.use('*', requireAuth)

async function assertMember(c: Parameters<typeof requireAuth>[0], groupId: string) {
  const userId = c.get('userId')
  const membership = await c.env.DB.prepare(
    "SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'"
  )
    .bind(groupId, userId)
    .first()
  if (!membership) throw new ForbiddenError('You are not an active member of this group')
}

/**
 * Only the person who paid (and the group owner) may edit or delete an
 * expense; otherwise any member could rewrite someone else's debt.
 */
async function assertCanManageExpense(
  c: Parameters<typeof requireAuth>[0],
  expense: { group_id: string; paid_by: string }
) {
  const userId = c.get('userId')
  if (expense.paid_by === userId) return
  const role = await getMemberRole(c.env.DB, expense.group_id, userId)
  if (role === 'owner' || role === 'admin') return
  throw new ForbiddenError('Only the payer or a group admin can modify this expense')
}

async function getExpense(env: AppEnv['Bindings'], expenseId: string) {
  return env.DB.prepare(
    `SELECT e.*, u.name AS paid_by_name FROM expenses e JOIN users u ON u.id = e.paid_by
     WHERE e.id = ? AND e.deleted_at IS NULL`
  )
    .bind(expenseId)
    .first<ExpenseRow & { paid_by_name: string }>()
}

interface ExpenseRow {
  id: string
  group_id: string
  paid_by: string
  amount_paise: number
  currency: string
  description: string
  category: string | null
  split_mode: string
  split_variant: string | null
  expense_date: string
  created_at: string
  updated_at: string | null
}

expenseRoutes.post('/groups/:id/expenses', async (c) => {
  const groupId = c.req.param('id')
  await assertMember(c, groupId)
  const body = createExpenseSchema.parse(await c.req.json())
  const { DB } = c.env

  const group = await DB.prepare('SELECT id, name, currency FROM groups WHERE id = ?')
    .bind(groupId)
    .first<{ id: string; name: string; currency: string | null }>()
  if (!group) throw new NotFoundError('Group not found')

  // The payer and every participant must be an active member of the group,
  // otherwise balances could be booked against arbitrary users.
  await assertActiveMembers(DB, groupId, [body.paidBy, ...body.participants.map((p) => p.userId)], 'participants')

  const expenseId = newId()
  const created = nowIso()
  const expenseDate = body.expenseDate ?? todayStr()

  const splits = computeSplits({
    amountPaise: body.amountPaise,
    mode: body.splitMode,
    participants: body.participants,
  })

  const statements: D1PreparedStatement[] = [
    DB.prepare(
      'INSERT INTO expenses (id, group_id, paid_by, amount_paise, currency, description, category, split_mode, split_variant, expense_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(expenseId, groupId, body.paidBy, body.amountPaise, group.currency ?? 'INR', body.description, body.category ?? null,
      body.splitMode === 'shares' ? 'equally' : body.splitMode,
      body.splitMode === 'shares' ? 'shares' : null,
      expenseDate, created, created),
  ]

  for (const s of splits) {
    statements.push(
      DB.prepare(
        'INSERT INTO expense_splits (id, expense_id, user_id, amount_paise, weight, settled) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(newId(), expenseId, s.userId, s.amountPaise, s.weight ?? null, 0)
    )
  }

  for (const s of splits) {
    if (s.userId === body.paidBy) continue
    const id = newId()
    statements.push(
      DB.prepare(
        `INSERT INTO balances (id, group_id, user_id, counterpart_id, net_amount_paise, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_id, user_id, counterpart_id)
         DO UPDATE SET net_amount_paise = net_amount_paise + excluded.net_amount_paise, updated_at = excluded.updated_at`
      ).bind(id, groupId, body.paidBy, s.userId, s.amountPaise, created)
    )
  }

  statements.push(
    DB.prepare(
      'INSERT INTO activity_events (id, user_id, type, group_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      newId(),
      body.paidBy,
      'expense_added',
      groupId,
      JSON.stringify({ expenseId, amountPaise: body.amountPaise, groupName: group.name, description: body.description }),
      created
    )
  )

  await DB.batch(statements)
  return c.json({ expense: { id: expenseId } }, 201)
})

expenseRoutes.get('/groups/:id/expenses', async (c) => {
  const groupId = c.req.param('id')
  const userId = c.get('userId')
  await assertMember(c, groupId)
  const { DB } = c.env

  const rows = await DB.prepare(
    `SELECT e.id, e.description, e.amount_paise, e.expense_date, e.category, e.split_mode, e.split_variant, e.paid_by, u.name AS paid_by_name
     FROM expenses e JOIN users u ON u.id = e.paid_by
     WHERE e.group_id = ? AND e.deleted_at IS NULL
     ORDER BY e.expense_date DESC, e.created_at DESC`
  )
    .bind(groupId)
    .all<{
      id: string
      description: string
      amount_paise: number
      expense_date: string
      category: string | null
      split_mode: string
      split_variant: string | null
      paid_by: string
      paid_by_name: string
    }>()

  const group = await DB.prepare('SELECT created_by FROM groups WHERE id = ?')
    .bind(groupId)
    .first<{ created_by: string }>()

  return c.json({
    expenses: rows.results.map(row => ({
      ...row,
      split_mode: row.split_variant ?? row.split_mode,
      canEdit: row.paid_by === userId || row.paid_by === group?.created_by,
    })),
  })
})

expenseRoutes.get('/expenses/:id', async (c) => {
  const expenseId = c.req.param('id')
  const userId = c.get('userId')
  const { DB } = c.env

  const expense = await getExpense(c.env, expenseId)
  if (!expense) throw new NotFoundError('Expense not found')

  const membership = await DB.prepare(
    "SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'"
  )
    .bind(expense.group_id, userId)
    .first()
  if (!membership) throw new ForbiddenError('You are not an active member of this group')

  const splits = await DB.prepare(
    `SELECT es.user_id, es.amount_paise, es.weight, es.settled, u.name
     FROM expense_splits es JOIN users u ON u.id = es.user_id WHERE es.expense_id = ?`
  )
    .bind(expenseId)
    .all<{ user_id: string; amount_paise: number; weight: number | null; settled: number; name: string }>()

  const role = await getMemberRole(c.env.DB, expense.group_id, userId)
  const canEdit = expense.paid_by === userId || role === 'owner' || role === 'admin'

  return c.json({
    expense: {
      id: expense.id,
      groupId: expense.group_id,
      description: expense.description,
      amountPaise: expense.amount_paise,
      expenseDate: expense.expense_date,
      category: expense.category,
      splitMode: expense.split_variant ?? expense.split_mode,
      paidBy: expense.paid_by,
      paidByName: expense.paid_by_name,
      currency: expense.currency,
      createdAt: expense.created_at,
      canEdit,
      splits: splits.results,
    },
  })
})

expenseRoutes.patch('/expenses/:id', async (c) => {
  const expenseId = c.req.param('id')
  const userId = c.get('userId')
  const body = patchExpenseSchema.parse(await c.req.json())
  const { DB } = c.env

  const expense = await getExpense(c.env, expenseId)
  if (!expense) throw new NotFoundError('Expense not found')
  const membership = await DB.prepare(
    "SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'"
  )
    .bind(expense.group_id, userId)
    .first()
  if (!membership) throw new ForbiddenError('You are not an active member of this group')
  await assertCanManageExpense(c, expense)

  const paidBy = body.paidBy ?? expense.paid_by
  const amountPaise = body.amountPaise ?? expense.amount_paise
  const splitMode = (body.splitMode ?? expense.split_variant ?? expense.split_mode) as 'equally' | 'exact' | 'percent' | 'shares'
  const expenseDate = body.expenseDate ?? expense.expense_date
  const description = body.description ?? expense.description
  const category = body.category !== undefined ? body.category : expense.category

  const oldSplits = await DB.prepare(
    'SELECT user_id, amount_paise, weight, settled FROM expense_splits WHERE expense_id = ?'
  )
    .bind(expenseId)
    .all<{ user_id: string; amount_paise: number; weight: number | null; settled: number }>()

  // A PATCH may omit `participants` (e.g. only the description changed). In
  // that case re-use the current split definition and recompute the shares.
  const participants =
    body.participants ??
    oldSplits.results.map((s) =>
      splitMode === 'exact'
        ? { userId: s.user_id, amountPaise: s.amount_paise }
        : splitMode === 'percent'
          ? { userId: s.user_id, weight: s.weight ?? 0 }
          : splitMode === 'shares'
            ? { userId: s.user_id, shares: s.weight ?? 1 }
            : { userId: s.user_id }
    )

  if (participants.length === 0) {
    throw new BadRequestError('At least one participant is required')
  }
  await assertActiveMembers(DB, expense.group_id, [paidBy, ...participants.map((p) => p.userId)], 'participants')

  const splits = computeSplits({
    amountPaise,
    mode: splitMode,
    participants,
  })

  const now = nowIso()
  const statements: D1PreparedStatement[] = []

  // Reverse the balances booked by the previous version of the expense.
  for (const s of oldSplits.results) {
    if (s.user_id === expense.paid_by) continue
    statements.push(
      DB.prepare(
        `INSERT INTO balances (id, group_id, user_id, counterpart_id, net_amount_paise, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_id, user_id, counterpart_id)
         DO UPDATE SET net_amount_paise = net_amount_paise + excluded.net_amount_paise, updated_at = excluded.updated_at`
      ).bind(newId(), expense.group_id, expense.paid_by, s.user_id, -s.amount_paise, now)
    )
  }

  statements.push(
    DB.prepare(
      'UPDATE expenses SET paid_by = ?, amount_paise = ?, description = ?, category = ?, split_mode = ?, split_variant = ?, expense_date = ?, updated_at = ? WHERE id = ?'
    ).bind(paidBy, amountPaise, description, category, splitMode === 'shares' ? 'equally' : splitMode,
      splitMode === 'shares' ? 'shares' : null, expenseDate, now, expenseId)
  )
  statements.push(DB.prepare('DELETE FROM expense_splits WHERE expense_id = ?').bind(expenseId))

  // Keep the `settled` flag for shares whose amount did not change.
  const settledByUser = new Map(oldSplits.results.map((s) => [s.user_id, s]))
  for (const s of splits) {
    const previous = settledByUser.get(s.userId)
    const keepSettled = previous && previous.settled === 1 && previous.amount_paise === s.amountPaise ? 1 : 0
    statements.push(
      DB.prepare(
        'INSERT INTO expense_splits (id, expense_id, user_id, amount_paise, weight, settled) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(newId(), expenseId, s.userId, s.amountPaise, s.weight ?? null, keepSettled)
    )
    if (s.userId === paidBy) continue
    statements.push(
      DB.prepare(
        `INSERT INTO balances (id, group_id, user_id, counterpart_id, net_amount_paise, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_id, user_id, counterpart_id)
         DO UPDATE SET net_amount_paise = net_amount_paise + excluded.net_amount_paise, updated_at = excluded.updated_at`
      ).bind(newId(), expense.group_id, paidBy, s.userId, s.amountPaise, now)
    )
  }

  statements.push(
    DB.prepare(
      'INSERT INTO activity_events (id, user_id, type, group_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      newId(),
      userId,
      'expense_edited',
      expense.group_id,
      JSON.stringify({ expenseId, amountPaise, description }),
      now
    )
  )

  await DB.batch(statements)
  return c.json({ ok: true })
})

expenseRoutes.delete('/expenses/:id', async (c) => {
  const expenseId = c.req.param('id')
  const userId = c.get('userId')
  const { DB } = c.env

  const expense = await getExpense(c.env, expenseId)
  if (!expense) throw new NotFoundError('Expense not found')
  const membership = await DB.prepare(
    "SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'"
  )
    .bind(expense.group_id, userId)
    .first()
  if (!membership) throw new ForbiddenError('You are not an active member of this group')
  await assertCanManageExpense(c, expense)

  const splits = await DB.prepare('SELECT user_id, amount_paise FROM expense_splits WHERE expense_id = ?')
    .bind(expenseId)
    .all<{ user_id: string; amount_paise: number }>()

  const now = nowIso()
  // Soft delete: keep the splits so the entry can be restored with Undo.
  const statements: D1PreparedStatement[] = [
    DB.prepare('UPDATE expenses SET deleted_at = ?, updated_at = ? WHERE id = ?').bind(now, now, expenseId),
  ]
  for (const s of splits.results) {
    if (s.user_id === expense.paid_by) continue
    statements.push(
      DB.prepare(
        `INSERT INTO balances (id, group_id, user_id, counterpart_id, net_amount_paise, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_id, user_id, counterpart_id)
         DO UPDATE SET net_amount_paise = net_amount_paise + excluded.net_amount_paise, updated_at = excluded.updated_at`
      ).bind(newId(), expense.group_id, expense.paid_by, s.user_id, -s.amount_paise, now)
    )
  }

  await DB.batch(statements)
  return c.json({ ok: true })
})

/* ---------- Comments ---------- */

expenseRoutes.get('/expenses/:id/comments', async (c) => {
  const expense = await getExpense(c.env, c.req.param('id'))
  if (!expense) throw new NotFoundError('Expense not found')
  const rows = await c.env.DB.prepare(
    `SELECT c.id, c.body, c.created_at, u.id AS user_id, u.name AS user_name
     FROM expense_comments c JOIN users u ON u.id = c.user_id
     WHERE c.expense_id = ? ORDER BY c.created_at ASC`
  )
    .bind(c.req.param('id'))
    .all<{ id: string; body: string; created_at: string; user_id: string; user_name: string }>()
  return c.json({ comments: rows.results })
})

expenseRoutes.post('/expenses/:id/comments', async (c) => {
  const expenseId = c.req.param('id')
  const userId = c.get('userId')
  const body = z.object({ body: z.string().min(1).max(500) }).parse(await c.req.json())
  const expense = await getExpense(c.env, expenseId)
  if (!expense) throw new NotFoundError('Expense not found')

  const id = newId()
  const created = nowIso()
  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare('INSERT INTO expense_comments (id, expense_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(id, expenseId, userId, body.body, created),
  ]
  if (expense.paid_by !== userId) {
    statements.push(
      c.env.DB.prepare(
        'INSERT INTO notifications (id, user_id, title, body, type, ref_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)'
      ).bind(newId(), expense.paid_by, 'New comment on an expense', body.body.slice(0, 120), 'expense_comment', expenseId, created)
    )
  }
  await c.env.DB.batch(statements)
  return c.json({ comment: { id } }, 201)
})

expenseRoutes.delete('/expenses/:id/comments/:commentId', async (c) => {
  const comment = await c.env.DB.prepare('SELECT user_id FROM expense_comments WHERE id = ? AND expense_id = ?')
    .bind(c.req.param('commentId'), c.req.param('id'))
    .first<{ user_id: string }>()
  if (!comment) throw new NotFoundError('Comment not found')
  if (comment.user_id !== c.get('userId')) throw new ForbiddenError('You can only delete your own comments')
  await c.env.DB.prepare('DELETE FROM expense_comments WHERE id = ?').bind(c.req.param('commentId')).run()
  return c.json({ ok: true })
})

/** Restore a soft-deleted expense and re-book its balances. */
expenseRoutes.post('/expenses/:id/restore', async (c) => {
  const expenseId = c.req.param('id')
  const userId = c.get('userId')
  const { DB } = c.env

  const expense = await DB.prepare(
    `SELECT e.*, u.name AS paid_by_name FROM expenses e JOIN users u ON u.id = e.paid_by
     WHERE e.id = ? AND e.deleted_at IS NOT NULL`
  )
    .bind(expenseId)
    .first<ExpenseRow & { paid_by_name: string }>()
  if (!expense) throw new NotFoundError('Deleted expense not found')

  const membership = await DB.prepare(
    "SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'active'"
  )
    .bind(expense.group_id, userId)
    .first()
  if (!membership) throw new ForbiddenError('You are not an active member of this group')
  await assertCanManageExpense(c, expense)

  const splits = await DB.prepare('SELECT user_id, amount_paise FROM expense_splits WHERE expense_id = ?')
    .bind(expenseId)
    .all<{ user_id: string; amount_paise: number }>()

  const now = nowIso()
  const statements: D1PreparedStatement[] = [
    DB.prepare('UPDATE expenses SET deleted_at = NULL, updated_at = ? WHERE id = ?').bind(now, expenseId),
  ]
  for (const s of splits.results) {
    if (s.user_id === expense.paid_by) continue
    statements.push(
      DB.prepare(
        `INSERT INTO balances (id, group_id, user_id, counterpart_id, net_amount_paise, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_id, user_id, counterpart_id)
         DO UPDATE SET net_amount_paise = net_amount_paise + excluded.net_amount_paise, updated_at = excluded.updated_at`
      ).bind(newId(), expense.group_id, expense.paid_by, s.user_id, s.amount_paise, now)
    )
  }
  await DB.batch(statements)
  return c.json({ ok: true })
})
