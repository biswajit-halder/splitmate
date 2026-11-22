import { ZodError } from 'zod'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { AppError } from '../errors/AppError'
import type { AppEnv } from '../types'

export async function errorHandler(err: unknown, c: Context<AppEnv>) {
  if (err instanceof ZodError) {
    const details: Record<string, unknown> = {}
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_'
      details[key] = issue.message
    }
    return c.json({ error: 'Validation failed', details }, 400)
  }
  if (err instanceof SyntaxError) {
    // Malformed JSON request body (c.req.json()).
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400)
  }
  if (err instanceof AppError) {
    return c.json({ error: err.message, code: err.code }, err.status as ContentfulStatusCode)
  }
  console.error('Unhandled error', err)
  return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
}
