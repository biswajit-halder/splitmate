import { ForbiddenError } from '../errors/AppError'

/** Ids of the users that are active members of a group. */
export async function getActiveMemberIds(db: D1Database, groupId: string): Promise<Set<string>> {
  const rows = await db
    .prepare("SELECT user_id FROM group_members WHERE group_id = ? AND status = 'active' AND user_id IS NOT NULL")
    .bind(groupId)
    .all<{ user_id: string }>()
  return new Set(rows.results.map((r) => r.user_id))
}

/**
 * Guard for user ids that end up in money-moving tables (expense payers,
 * split participants, settlement parties). Without this a group member could
 * attribute a payment to, or split a debt with, somebody outside the group.
 */
export async function assertActiveMembers(
  db: D1Database,
  groupId: string,
  userIds: string[],
  what = 'participants'
): Promise<void> {
  const unique = [...new Set(userIds.filter((id) => typeof id === 'string' && id.length > 0))]
  if (unique.length === 0) {
    throw new ForbiddenError(`At least one ${what} is required`)
  }
  const active = await getActiveMemberIds(db, groupId)
  const missing = unique.filter((id) => !active.has(id))
  if (missing.length > 0) {
    throw new ForbiddenError(`All ${what} must be active members of this group`)
  }
}
