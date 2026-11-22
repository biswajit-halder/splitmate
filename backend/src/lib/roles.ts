import type { Context, Next } from 'hono'
import { ForbiddenError } from '../errors/AppError'
import type { AppEnv } from '../types'

export type GroupRole = 'owner' | 'admin' | 'member'

export async function getMemberRole(
  db: D1Database,
  groupId: string,
  userId: string
): Promise<GroupRole | null> {
  const row = await db.prepare('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?')
    .bind(groupId, userId)
    .first<{ role: GroupRole }>()
  return row?.role ?? null
}

/** Guard for group-scoped management actions. */
export async function assertGroupRole(
  c: Context<AppEnv>,
  groupId: string,
  ...allowed: GroupRole[]
): Promise<void> {
  const role = await getMemberRole(c.env.DB, groupId, c.get('userId'))
  if (!role || !allowed.includes(role)) {
    throw new ForbiddenError(`Requires ${allowed.join(' or ')} role in this group`)
  }
}

/** Middleware-style helper for routes that need an active member. */
export async function requireGroupMember(c: Context<AppEnv>, _next: Next) {
  const role = await getMemberRole(c.env.DB, c.req.param('id') ?? '', c.get('userId'))
  if (!role) throw new ForbiddenError('You are not a member of this group')
}
