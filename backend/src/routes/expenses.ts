import { Hono } from 'hono'
import { z } from 'zod'
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/AppError'
import { computeSplits } from '../lib/splits'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'
import { newId, nowIso, todayStr } from '../utils/ids'

const splitModeSchema = z.enum(['equally', 'exact', 'percent'])

const participantSchema = z.object({
  userId: z.string().min(1),
  amountPaise: z.number().int().nonnegative().optional(),
  weight: z.number().int().nonnegative().optional(),
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

async function getExpense(env: AppEnv['Bindings'], expenseId: string) {
  return env.DB.prepare(
    `SELECT e.*, u.name AS paid_by_name FROM expenses e JOIN users u ON u.id = e.paid_by WHERE e.id = ?`
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
  expense_date: string
  created_at: string
  updated_at: string | null
}

expenseRoutes.post('/groups/:id/expenses', async (c) => {
  const groupId = c.req.param('id')
  await assertMember(c, groupId)
  const body = createExpenseSchema.parse(await c.req.json())
  const { DB } = c.env

  const group = await DB.prepare('SELECT id, name FROM groups WHERE id = ?').bind(groupId).first<{ id: string; name: string }>()
  if (!group) throw new NotFoundError('Group not found')

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
      'INSERT INTO expenses (id, group_id, paid_by, amount_paise, currency, description, category, split_mode, expense_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(expenseId, groupId, body.paidBy, body.amountPaise, 'INR', body.description, body.category ?? null, body.splitMode, expenseDate, created, created),
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

  const month = expenseDate.slice(0, 7)
  statements.push(
    DB.prepare(
      `INSERT INTO spending_summary_monthly (id, user_id, month, total_paise, settled_paise, updated_at)
       VALUES (?, ?, ?, ?, 0, ?)
       ON CONFLICT(user_id, month)
       DO UPDATE SET total_paise = total_paise + excluded.total_paise, updated_at = excluded.updated_at`
    ).bind(newId(), body.paidBy, month, body.amountPaise, created)
  )

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
  await assertMember(c, groupId)
  const { DB } = c.env

  const rows = await DB.prepare(
    `SELECT e.id, e.description, e.amount_paise, e.expense_date, e.category, e.split_mode, e.paid_by, u.name AS paid_by_name
     FROM expenses e JOIN users u ON u.id = e.paid_by
     WHERE e.group_id = ?
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
      paid_by: string
      paid_by_name: string
    }>()

  return c.json({ expenses: rows.results })
})

expenseRoutes.get('/expenses/:id', async (c) => {
  const expenseId = c.req.param('id')
  const userId = c.get('userId')
  const { DB } = c.env

  const expense = await getExpense(c.env, expenseId)
  if (!expense) throw new NotFoundError('Expense not found')

  const membership = await DB.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?')
    .bind(expense.group_id, userId)
    .first()
  if (!membership) throw new ForbiddenError('You are not a member of this group')

  const splits = await DB.prepare(
    `SELECT es.user_id, es.amount_paise, es.weight, es.settled, u.name
     FROM expense_splits es JOIN users u ON u.id = es.user_id WHERE es.expense_id = ?`
  )
    .bind(expenseId)
    .all<{ user_id: string; amount_paise: number; weight: number | null; settled: number; name: string }>()

  return c.json({
    expense: {
      id: expense.id,
      groupId: expense.group_id,
      description: expense.description,
      amountPaise: expense.amount_paise,
      expenseDate: expense.expense_date,
      category: expense.category,
      splitMode: expense.split_mode,
      paidBy: expense.paid_by,
      paidByName: expense.paid_by_name,
      createdAt: expense.created_at,
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
  const membership = await DB.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?')
    .bind(expense.group_id, userId)
    .first()
  if (!membership) throw new ForbiddenError('You are not a member of this group')

  const paidBy = body.paidBy ?? expense.paid_by
  const amountPaise = body.amountPaise ?? expense.amount_paise
  const splitMode = (body.splitMode ?? expense.split_mode) as 'equally' | 'exact' | 'percent'
  const expenseDate = body.expenseDate ?? expense.expense_date
  const description = body.description ?? expense.description
  const category = body.category !== undefined ? body.category : expense.category

  const splits = computeSplits({
    amountPaise,
    mode: splitMode,
    participants: body.participants ?? [],
  })

  const now = nowIso()
  const oldSplits = await DB.prepare('SELECT user_id, amount_paise FROM expense_splits WHERE expense_id = ?')
    .bind(expenseId)
    .all<{ user_id: string; amount_paise: number }>()

  const statements: D1PreparedStatement[] = []

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
      'UPDATE expenses SET paid_by = ?, amount_paise = ?, description = ?, category = ?, split_mode = ?, expense_date = ?, updated_at = ? WHERE id = ?'
    ).bind(paidBy, amountPaise, description, category, splitMode, expenseDate, now, expenseId)
  )
  statements.push(DB.prepare('DELETE FROM expense_splits WHERE expense_id = ?').bind(expenseId))

  for (const s of splits) {
    statements.push(
      DB.prepare(
        'INSERT INTO expense_splits (id, expense_id, user_id, amount_paise, weight, settled) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(newId(), expenseId, s.userId, s.amountPaise, s.weight ?? null, 0)
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

  await DB.batch(statements)
  return c.json({ ok: true })
})

expenseRoutes.delete('/expenses/:id', async (c) => {
  const expenseId = c.req.param('id')
  const userId = c.get('userId')
  const { DB } = c.env

  const expense = await getExpense(c.env, expenseId)
  if (!expense) throw new NotFoundError('Expense not found')
  const membership = await DB.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?')
    .bind(expense.group_id, userId)
    .first()
  if (!membership) throw new ForbiddenError('You are not a member of this group')

  const splits = await DB.prepare('SELECT user_id, amount_paise FROM expense_splits WHERE expense_id = ?')
    .bind(expenseId)
    .all<{ user_id: string; amount_paise: number }>()

  const now = nowIso()
  const statements: D1PreparedStatement[] = [
    DB.prepare('DELETE FROM expense_splits WHERE expense_id = ?').bind(expenseId),
    DB.prepare('DELETE FROM expenses WHERE id = ?').bind(expenseId),
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
