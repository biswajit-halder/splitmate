import { Hono } from 'hono'
import { z } from 'zod'
import { BadRequestError } from '../errors/AppError'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')

export const analyticsRoutes = new Hono<AppEnv>()

analyticsRoutes.use('*', requireAuth)

/** One request for the whole dashboard trend instead of N monthly calls. */
analyticsRoutes.get('/analytics/trend', async (c) => {
  const userId = c.get('userId')
  const raw = c.req.query('months')
  const months = raw ? Number(raw) : 6
  if (!Number.isInteger(months) || months < 1 || months > 12) {
    throw new BadRequestError('months must be between 1 and 12')
  }

  const { DB } = c.env
  const now = new Date()
  const keys = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const start = `${keys[0]}-01`

  const spentRows = await DB.prepare(
    `SELECT substr(expense_date, 1, 7) AS month, COALESCE(SUM(amount_paise), 0) AS total
     FROM expenses WHERE paid_by = ? AND deleted_at IS NULL AND expense_date >= ? GROUP BY month`
  )
    .bind(userId, start)
    .all<{ month: string; total: number }>()

  const settledRows = await DB.prepare(
    `SELECT substr(created_at, 1, 7) AS month, COALESCE(SUM(amount_paise), 0) AS total
     FROM settlements
     WHERE status = 'completed' AND (payer_id = ? OR payee_id = ?) AND created_at >= ?
     GROUP BY month`
  )
    .bind(userId, userId, start)
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

analyticsRoutes.get('/analytics/monthly', async (c) => {
  const userId = c.get('userId')
  const monthRaw = c.req.query('month')
  if (monthRaw && !monthSchema.safeParse(monthRaw).success) throw new BadRequestError('Invalid month format')
  const month = monthRaw ?? new Date().toISOString().slice(0, 7)
  const { DB } = c.env

  // Computed from the source tables so edits/deletes are always reflected
  // (the old denormalised summary table drifted out of sync).
  const spent = await DB.prepare(
    `SELECT COALESCE(SUM(amount_paise), 0) AS total
     FROM expenses WHERE paid_by = ? AND deleted_at IS NULL AND substr(expense_date, 1, 7) = ?`
  )
    .bind(userId, month)
    .first<{ total: number }>()

  const settled = await DB.prepare(
    `SELECT COALESCE(SUM(amount_paise), 0) AS total
     FROM settlements
     WHERE status = 'completed'
       AND (payer_id = ? OR payee_id = ?)
       AND substr(created_at, 1, 7) = ?`
  )
    .bind(userId, userId, month)
    .first<{ total: number }>()

  return c.json({
    month,
    totalPaise: spent?.total ?? 0,
    settledPaise: settled?.total ?? 0,
  })
})

analyticsRoutes.get('/analytics/breakdown', async (c) => {
  const userId = c.get('userId')
  const { DB } = c.env

  const byGroup = await DB.prepare(
    `SELECT g.id AS group_id, g.name AS group_name, COALESCE(SUM(es.amount_paise), 0) AS total_paise
     FROM expenses e
     JOIN expense_splits es ON es.expense_id = e.id
     JOIN groups g ON g.id = e.group_id
     WHERE es.user_id = ? AND e.paid_by != ? AND e.deleted_at IS NULL
     GROUP BY g.id ORDER BY total_paise DESC`
  )
    .bind(userId, userId)
    .all<{ group_id: string; group_name: string; total_paise: number }>()

  const byCategory = await DB.prepare(
    `SELECT COALESCE(e.category, 'other') AS category, COALESCE(SUM(es.amount_paise), 0) AS total_paise
     FROM expenses e
     JOIN expense_splits es ON es.expense_id = e.id
     WHERE es.user_id = ? AND e.paid_by != ? AND e.deleted_at IS NULL
     GROUP BY category ORDER BY total_paise DESC`
  )
    .bind(userId, userId)
    .all<{ category: string; total_paise: number }>()

  const largest = await DB.prepare(
    `SELECT e.id, e.description, e.amount_paise, u.name AS paid_by_name
     FROM expenses e
     JOIN users u ON u.id = e.paid_by
     WHERE e.deleted_at IS NULL AND e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = ?)
     ORDER BY e.amount_paise DESC LIMIT 5`
  )
    .bind(userId)
    .all<{ id: string; description: string; amount_paise: number; paid_by_name: string }>()

  return c.json({
    byGroup: byGroup.results,
    byCategory: byCategory.results,
    largestExpenses: largest.results,
  })
})
