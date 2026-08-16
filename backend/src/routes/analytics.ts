import { Hono } from 'hono'
import { z } from 'zod'
import { BadRequestError } from '../errors/AppError'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')

export const analyticsRoutes = new Hono<AppEnv>()

analyticsRoutes.use('*', requireAuth)

analyticsRoutes.get('/analytics/monthly', async (c) => {
  const userId = c.get('userId')
  const monthRaw = c.req.query('month')
  if (monthRaw && !monthSchema.safeParse(monthRaw).success) throw new BadRequestError('Invalid month format')
  const month = monthRaw ?? new Date().toISOString().slice(0, 7)
  const { DB } = c.env

  const rows = await DB.prepare(
    'SELECT month, total_paise, settled_paise FROM spending_summary_monthly WHERE user_id = ? AND month = ?'
  )
    .bind(userId, month)
    .all<{ month: string; total_paise: number; settled_paise: number }>()

  return c.json({
    month,
    totalPaise: rows.results.reduce((a, r) => a + r.total_paise, 0),
    settledPaise: rows.results.reduce((a, r) => a + r.settled_paise, 0),
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
     WHERE es.user_id = ? AND e.paid_by != ?
     GROUP BY g.id ORDER BY total_paise DESC`
  )
    .bind(userId, userId)
    .all<{ group_id: string; group_name: string; total_paise: number }>()

  const byCategory = await DB.prepare(
    `SELECT COALESCE(e.category, 'other') AS category, COALESCE(SUM(es.amount_paise), 0) AS total_paise
     FROM expenses e
     JOIN expense_splits es ON es.expense_id = e.id
     WHERE es.user_id = ? AND e.paid_by != ?
     GROUP BY category ORDER BY total_paise DESC`
  )
    .bind(userId, userId)
    .all<{ category: string; total_paise: number }>()

  const largest = await DB.prepare(
    `SELECT e.id, e.description, e.amount_paise, u.name AS paid_by_name
     FROM expenses e JOIN users u ON u.id = e.paid_by
     WHERE e.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
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
