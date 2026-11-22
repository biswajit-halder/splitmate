import type { ExecutionContext, ScheduledController } from '@cloudflare/workers-types'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { AppError } from './errors/AppError'
import { sendEmail } from './lib/email'
import { apiRateLimit } from './middleware/rateLimit'
import { corsMiddleware } from './middleware/cors'
import { originGuard } from './middleware/origin'
import { errorHandler } from './middleware/errorHandler'
import { activityRoutes } from './routes/activity'
import { analyticsRoutes } from './routes/analytics'
import { authRoutes } from './routes/auth'
import { balanceRoutes } from './routes/balances'
import { expenseRoutes } from './routes/expenses'
import { friendRoutes } from './routes/friends'
import { groupRoutes } from './routes/groups'
import { notificationRoutes } from './routes/notifications'
import { settlementRoutes } from './routes/settlements'
import { userRoutes } from './routes/users'
import type { AppEnv, Bindings } from './types'

const app = new Hono<AppEnv>()

/**
 * Fail closed when the Worker is missing its signing secret. Without this,
 * an unset/placeholder JWT_SECRET would let anyone forge a session token.
 * Production: `npx wrangler secret put JWT_SECRET`.
 * Local dev: put the value in `backend/.dev.vars`.
 */
const MIN_SECRET_LENGTH = 32

app.use('*', async (c, next) => {
  const secret = c.env.JWT_SECRET
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new AppError(
      'Server is not configured: JWT_SECRET is missing or too short. ' +
        'Set it with `wrangler secret put JWT_SECRET` (prod) or in backend/.dev.vars (dev).',
      500,
      'CONFIG_ERROR'
    )
  }
  await next()
})

app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', corsMiddleware)
app.use('/api/*', originGuard)
app.use('/api/*', (c, next) => {
  if (c.req.path.startsWith('/api/auth')) return next()
  return apiRateLimit(c, next)
})
app.onError(errorHandler)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

app.route('/api/auth', authRoutes)
app.route('/api/users', userRoutes)
app.route('/api', friendRoutes)
app.route('/api', groupRoutes)
app.route('/api', expenseRoutes)
app.route('/api', balanceRoutes)
app.route('/api', settlementRoutes)
app.route('/api', activityRoutes)
app.route('/api', notificationRoutes)
app.route('/api', analyticsRoutes)

/**
 * Daily reminder for settlements that have been pending for over a day.
 * Enabled by adding a cron trigger in wrangler.jsonc; no-ops without an
 * email webhook configured.
 */
export const scheduled = async (
  _controller: ScheduledController,
  env: Bindings,
  _ctx: ExecutionContext
): Promise<void> => {
  if (!env.DB || !env.EMAIL_WEBHOOK_URL) return
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const pending = await env.DB.prepare(
    `SELECT s.id, s.amount_paise, u.email
     FROM settlements s JOIN users u ON u.id = s.payee_id
     WHERE s.status = 'pending' AND s.created_at < ?`
  )
    .bind(cutoff)
    .all<{ id: string; amount_paise: number; email: string }>()

  for (const settlement of pending.results) {
    await sendEmail(
      env,
      settlement.email,
      'Settlement awaiting confirmation',
      `A payment of ${settlement.amount_paise / 100} INR is waiting for your confirmation in SplitMate.`
    )
  }
}

export default app
