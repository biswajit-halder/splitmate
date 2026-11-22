import { Hono } from 'hono'
import { z } from 'zod'
import { BadRequestError } from '../errors/AppError'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')
const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

export const analyticsRoutes = new Hono<AppEnv>()

analyticsRoutes.use('*', requireAuth)

function monthKeys(count: number, from?: string, to?: string): string[] {
  if (from && to) {
    const start = new Date(`${from}-01T00:00:00Z`)
    const end = new Date(`${to}-01T00:00:00Z`)
    if (start > end) throw new BadRequestError('from must be before to')
    const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1
    if (months > 24) throw new BadRequestError('Range cannot exceed 24 months')
    return Array.from({ length: months }, (_, i) => {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1))
      return d.toISOString().slice(0, 7)
    })
  }
  const now = new Date()
  return Array.from({ length: Math.min(24, count) }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1 - i), 1))
    return d.toISOString().slice(0, 7)
  })
}

function rangeFromKeys(keys: string[]): { start: string; end: string } {
  return { start: `${keys[0]}-01`, end: `${keys[keys.length - 1]}-31` }
}

analyticsRoutes.get('/analytics/range', async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')
  if (from && !monthSchema.safeParse(from).success) throw new BadRequestError('Invalid from month')
  if (to && !monthSchema.safeParse(to).success) throw new BadRequestError('Invalid to month')
  const keys = monthKeys(6, from, to)
  const { start, end } = rangeFromKeys(keys)
  return c.json({ months: keys, from: start, to: end })
})

analyticsRoutes.get('/analytics/monthly', async (c) => {
  const userId = c.get('userId')
  const monthRaw = c.req.query('month')
  if (monthRaw && !monthSchema.safeParse(monthRaw).success) throw new BadRequestError('Invalid month format')
  const month = monthRaw ?? new Date().toISOString().slice(0, 7)
  const { DB } = c.env

  const spent = await DB.prepare(
    `SELECT COALESCE(SUM(amount_paise), 0) AS total
     FROM expenses WHERE paid_by = ? AND deleted_at IS NULL AND substr(expense_date, 1, 7) = ?`
  )
    .bind(userId, month)
    .first<{ total: number }>()

  const settled = await DB.prepare(
    `SELECT COALESCE(SUM(amount_paise), 0) AS total
     FROM settlements
     WHERE status = 'completed' AND (payer_id = ? OR payee_id = ?) AND substr(created_at, 1, 7) = ?`
  )
    .bind(userId, userId, month)
    .first<{ total: number }>()

  return c.json({ month, totalPaise: spent?.total ?? 0, settledPaise: settled?.total ?? 0 })
})

/** One request for the whole dashboard/analytics trend. */
analyticsRoutes.get('/analytics/trend', async (c) => {
  const userId = c.get('userId')
  const raw = c.req.query('months')
  const months = raw ? Number(raw) : 6
  if (!Number.isInteger(months) || months < 1 || months > 24) {
    throw new BadRequestError('months must be between 1 and 24')
  }
  const fromRaw = c.req.query('from')
  const toRaw = c.req.query('to')
  if (fromRaw && !monthSchema.safeParse(fromRaw).success) throw new BadRequestError('Invalid from month')
  if (toRaw && !monthSchema.safeParse(toRaw).success) throw new BadRequestError('Invalid to month')

  const keys = monthKeys(months, fromRaw, toRaw)
  const { DB } = c.env
  const start = `${keys[0]}-01`
  const end = `${keys[keys.length - 1]}-31`

  const spentRows = await DB.prepare(
    `SELECT substr(expense_date, 1, 7) AS month, COALESCE(SUM(amount_paise), 0) AS total
     FROM expenses WHERE paid_by = ? AND deleted_at IS NULL AND expense_date BETWEEN ? AND ? GROUP BY month`
  )
    .bind(userId, start, end)
    .all<{ month: string; total: number }>()

  const settledRows = await DB.prepare(
    `SELECT substr(created_at, 1, 7) AS month, COALESCE(SUM(amount_paise), 0) AS total
     FROM settlements
     WHERE status = 'completed' AND (payer_id = ? OR payee_id = ?) AND created_at BETWEEN ? AND ?
     GROUP BY month`
  )
    .bind(userId, userId, start, end)
    .all<{ month: string; total: number }>()

  const spent = new Map(spentRows.results.map(r => [r.month, r.total]))
  const settled = new Map(settledRows.results.map(r => [r.month, r.total]))

  return c.json({
    months: keys.map(month => ({
      month,
      totalPaise: spent.get(month) ?? 0,
      settledPaise: settled.get(month) ?? 0,
    })),
  })
})

/** Running net position over time, derived from expense splits + settlements. */
analyticsRoutes.get('/analytics/balance-history', async (c) => {
  const userId = c.get('userId')
  const raw = c.req.query('months')
  const months = raw ? Number(raw) : 6
  if (!Number.isInteger(months) || months < 1 || months > 24) {
    throw new BadRequestError('months must be between 1 and 24')
  }
  const { DB } = c.env
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1))
    .toISOString().slice(0, 10)

  const paid = await DB.prepare(
    `SELECT expense_date AS date,
            amount_paise - COALESCE((SELECT es.amount_paise FROM expense_splits es
              WHERE es.expense_id = e.id AND es.user_id = ?), 0) AS delta
     FROM expenses e WHERE e.paid_by = ? AND e.deleted_at IS NULL AND e.expense_date >= ?`
  ).bind(userId, userId, start).all<{ date: string; delta: number }>()

  const owed = await DB.prepare(
    `SELECT e.expense_date AS date, -es.amount_paise AS delta
     FROM expense_splits es JOIN expenses e ON e.id = es.expense_id
     WHERE es.user_id = ? AND e.paid_by != ? AND e.deleted_at IS NULL AND e.expense_date >= ?`
  ).bind(userId, userId, start).all<{ date: string; delta: number }>()

  const settled = await DB.prepare(
    `SELECT substr(created_at, 1, 10) AS date,
            CASE WHEN payer_id = ? THEN amount_paise ELSE -amount_paise END AS delta
     FROM settlements
     WHERE status = 'completed' AND (payer_id = ? OR payee_id = ?) AND created_at >= ?`
  ).bind(userId, userId, userId, start).all<{ date: string; delta: number }>()

  const events = [...paid.results, ...owed.results, ...settled.results]
    .map(e => ({ month: e.date.slice(0, 7), delta: e.delta }))
    .sort((a, b) => a.month.localeCompare(b.month))

  let running = 0
  const byMonth = new Map<string, number>()
  for (const event of events) {
    running += event.delta
    byMonth.set(event.month, running)
  }
  const keys = monthKeys(months)
  return c.json({ months: keys.map(month => ({ month, netPaise: byMonth.get(month) ?? 0 })) })
})

analyticsRoutes.get('/analytics/breakdown', async (c) => {
  const userId = c.get('userId')
  const { DB } = c.env
  const from = c.req.query('from')
  const to = c.req.query('to')
  if (from && !daySchema.safeParse(from).success) throw new BadRequestError('Invalid from date')
  if (to && !daySchema.safeParse(to).success) throw new BadRequestError('Invalid to date')
  const dateClause = from && to ? ' AND e.expense_date BETWEEN ? AND ?' : ''
  const dateArgs = from && to ? [from, to] : []

  const byGroup = await DB.prepare(
    `SELECT g.id AS group_id, g.name AS group_name, COALESCE(SUM(es.amount_paise), 0) AS total_paise
     FROM expenses e
     JOIN expense_splits es ON es.expense_id = e.id
     JOIN groups g ON g.id = e.group_id
     WHERE es.user_id = ? AND e.paid_by != ? AND e.deleted_at IS NULL${dateClause}
     GROUP BY g.id ORDER BY total_paise DESC`
  )
    .bind(userId, userId, ...dateArgs)
    .all<{ group_id: string; group_name: string; total_paise: number }>()

  const byCategory = await DB.prepare(
    `SELECT COALESCE(e.category, 'other') AS category, COALESCE(SUM(es.amount_paise), 0) AS total_paise
     FROM expenses e
     JOIN expense_splits es ON es.expense_id = e.id
     WHERE es.user_id = ? AND e.paid_by != ? AND e.deleted_at IS NULL${dateClause}
     GROUP BY category ORDER BY total_paise DESC`
  )
    .bind(userId, userId, ...dateArgs)
    .all<{ category: string; total_paise: number }>()

  const largest = await DB.prepare(
    `SELECT e.id, e.description, e.amount_paise, u.name AS paid_by_name
     FROM expenses e
     JOIN users u ON u.id = e.paid_by
     WHERE e.deleted_at IS NULL AND e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = ?)${dateClause}
     ORDER BY e.amount_paise DESC LIMIT 5`
  )
    .bind(userId, ...dateArgs)
    .all<{ id: string; description: string; amount_paise: number; paid_by_name: string }>()

  return c.json({ byGroup: byGroup.results, byCategory: byCategory.results, largestExpenses: largest.results })
})
