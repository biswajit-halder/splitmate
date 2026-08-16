import type { Context, Next } from 'hono'
import { AppError } from '../errors/AppError'
import type { AppEnv } from '../types'

interface Bucket {
  tokens: number
  lastRefill: number
}

// In-memory token buckets. Only correct per-isolate; in production Cloudflare
// Rate Limiting Rules handle this. Local/dev only.
const buckets = new Map<string, Bucket>()
const REFILL_EVERY_MS = 10_000
const MAX_CAPACITY = 1000

export function rateLimit(limit: number, windowMs: number) {
  return async (c: Context<AppEnv>, next: Next) => {
    if (c.env.RATE_LIMIT_DISABLED === 'true') return next()
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
    const key = `${c.req.path}:${ip}`
    const now = Date.now()
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { tokens: limit, lastRefill: now }
      buckets.set(key, bucket)
    }
    const refill = Math.floor((now - bucket.lastRefill) / windowMs)
    if (refill > 0) {
      bucket.tokens = Math.min(limit, bucket.tokens + refill * limit)
      bucket.lastRefill = now
    }
    if (bucket.tokens <= 0) {
      throw new AppError('Too many requests', 429, 'RATE_LIMITED')
    }
    bucket.tokens -= 1
    if (buckets.size > MAX_CAPACITY) buckets.clear()
    c.header('X-RateLimit-Limit', String(limit))
    c.header('X-RateLimit-Remaining', String(Math.max(0, bucket.tokens)))
    await next()
  }
}

export const loginRateLimit = rateLimit(10, 10_000)
export const apiRateLimit = rateLimit(60, 60_000)
