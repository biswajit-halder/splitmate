import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { apiRateLimit } from './middleware/rateLimit'
import { corsMiddleware } from './middleware/cors'
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

app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', corsMiddleware)
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

export default app
