import { describe, expect, it } from 'vitest'
import { api, extractCookie, registerUser, uniqueEmail } from './helpers'

async function authUser(name: string) {
  const email = uniqueEmail()
  const reg = await registerUser(email, name)
  const me = await api('/api/users/me', {}, extractCookie(reg.setCookie)!)
  return { email, cookie: extractCookie(reg.setCookie)!, id: me.body.user.id }
}

async function makeGroup(owner: { cookie: string }, invitees: Array<{ email: string; cookie: string }>) {
  const create = await api(
    '/api/groups',
    { method: 'POST', body: JSON.stringify({ name: 'Perm Group' }) },
    owner.cookie
  )
  const groupId = create.body.group.id
  for (const i of invitees) {
    await api(`/api/groups/${groupId}/invite`, { method: 'POST', body: JSON.stringify({ email: i.email }) }, owner.cookie)
    await api(`/api/groups/${groupId}/join`, { method: 'POST' }, i.cookie)
  }
  return groupId
}

async function createExpense(
  groupId: string,
  cookie: string,
  body: Record<string, unknown>
) {
  return api(`/api/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(body) }, cookie)
}

describe('expense authorization', () => {
  it('rejects a participant who is not an active group member', async () => {
    const owner = await authUser('Owner')
    const outsider = await authUser('Outsider')
    const groupId = await makeGroup(owner, [])

    const res = await createExpense(groupId, owner.cookie, {
      description: 'Sneaky',
      amountPaise: 1000,
      paidBy: owner.id,
      splitMode: 'equally',
      participants: [{ userId: owner.id }, { userId: outsider.id }],
    })
    expect(res.status).toBe(403)
  })

  it('rejects a payer who is not an active group member', async () => {
    const owner = await authUser('Owner')
    const outsider = await authUser('Outsider')
    const groupId = await makeGroup(owner, [])

    const res = await createExpense(groupId, owner.cookie, {
      description: 'Sneaky',
      amountPaise: 1000,
      paidBy: outsider.id,
      splitMode: 'equally',
      participants: [{ userId: outsider.id }],
    })
    expect(res.status).toBe(403)
  })

  it('only the payer or the group owner can edit or delete an expense', async () => {
    const owner = await authUser('Owner')
    const bob = await authUser('Bob')
    const groupId = await makeGroup(owner, [bob])

    const created = await createExpense(groupId, bob.cookie, {
      description: 'Bob paid',
      amountPaise: 1000,
      paidBy: bob.id,
      splitMode: 'equally',
      participants: [{ userId: owner.id }, { userId: bob.id }],
    })
    expect(created.status).toBe(201)
    const expenseId = created.body.expense.id

    const byOther = await api(
      `/api/expenses/${expenseId}`,
      { method: 'PATCH', body: JSON.stringify({ description: 'Hijacked' }) },
      owner.cookie
    )
    expect(byOther.status).toBe(200) // the group owner may edit any expense

    const stranger = await authUser('Stranger')
    await api(`/api/groups/${groupId}/invite`, { method: 'POST', body: JSON.stringify({ email: stranger.email }) }, owner.cookie)
    await api(`/api/groups/${groupId}/join`, { method: 'POST' }, stranger.cookie)

    const byMember = await api(
      `/api/expenses/${expenseId}`,
      { method: 'PATCH', body: JSON.stringify({ description: 'Hijacked' }) },
      stranger.cookie
    )
    expect(byMember.status).toBe(403)

    const deleteByMember = await api(`/api/expenses/${expenseId}`, { method: 'DELETE' }, stranger.cookie)
    expect(deleteByMember.status).toBe(403)
  })

  it('exposes canEdit on the expense detail', async () => {
    const owner = await authUser('Owner')
    const bob = await authUser('Bob')
    const groupId = await makeGroup(owner, [bob])

    const created = await createExpense(groupId, bob.cookie, {
      description: 'Bob paid',
      amountPaise: 1000,
      paidBy: bob.id,
      splitMode: 'equally',
      participants: [{ userId: owner.id }, { userId: bob.id }],
    })
    const expenseId = created.body.expense.id

    const asBob = await api(`/api/expenses/${expenseId}`, {}, bob.cookie)
    expect(asBob.body.expense.canEdit).toBe(true)

    const asOwner = await api(`/api/expenses/${expenseId}`, {}, owner.cookie)
    expect(asOwner.body.expense.canEdit).toBe(true)
  })
})

describe('expense updates', () => {
  it('supports a partial update without participants and keeps balances correct', async () => {
    const owner = await authUser('Owner')
    const bob = await authUser('Bob')
    const groupId = await makeGroup(owner, [bob])

    const created = await createExpense(groupId, owner.cookie, {
      description: 'Dinner',
      amountPaise: 1000,
      paidBy: owner.id,
      splitMode: 'equally',
      participants: [{ userId: owner.id }, { userId: bob.id }],
    })
    const expenseId = created.body.expense.id

    const patched = await api(
      `/api/expenses/${expenseId}`,
      { method: 'PATCH', body: JSON.stringify({ description: 'Dinner (updated)' }) },
      owner.cookie
    )
    expect(patched.status).toBe(200)

    const detail = await api(`/api/expenses/${expenseId}`, {}, owner.cookie)
    expect(detail.body.expense.description).toBe('Dinner (updated)')
    expect(detail.body.expense.splits.length).toBe(2)

    const balances = await api(`/api/groups/${groupId}/balances`, {}, owner.cookie)
    const byId = new Map(balances.body.members.map((m: any) => [m.userId, m.netPaise]))
    expect(byId.get(owner.id)).toBe(500)
    expect(byId.get(bob.id)).toBe(-500)
  })

  it('recomputes shares when the amount changes', async () => {
    const owner = await authUser('Owner')
    const bob = await authUser('Bob')
    const groupId = await makeGroup(owner, [bob])

    const created = await createExpense(groupId, owner.cookie, {
      description: 'Dinner',
      amountPaise: 1000,
      paidBy: owner.id,
      splitMode: 'equally',
      participants: [{ userId: owner.id }, { userId: bob.id }],
    })
    const expenseId = created.body.expense.id

    const patched = await api(
      `/api/expenses/${expenseId}`,
      { method: 'PATCH', body: JSON.stringify({ amountPaise: 3000 }) },
      owner.cookie
    )
    expect(patched.status).toBe(200)

    const balances = await api(`/api/groups/${groupId}/balances`, {}, owner.cookie)
    const byId = new Map(balances.body.members.map((m: any) => [m.userId, m.netPaise]))
    expect(byId.get(owner.id)).toBe(1500)
    expect(byId.get(bob.id)).toBe(-1500)
  })
})

describe('soft delete and undo', () => {
  it('hides a deleted expense and restores its balances on undo', async () => {
    const owner = await authUser('Owner')
    const bob = await authUser('Bob')
    const groupId = await makeGroup(owner, [bob])
    const meBob = await api('/api/users/me', {}, bob.cookie)
    const bobId = meBob.body.user.id
    const meOwner = await api('/api/users/me', {}, owner.cookie)
    const ownerId = meOwner.body.user.id

    const created = await createExpense(groupId, owner.cookie, {
      description: 'Lunch', amountPaise: 1000, paidBy: ownerId, splitMode: 'equally',
      participants: [{ userId: ownerId }, { userId: bobId }],
    })
    const expenseId = created.body.expense.id

    expect((await api(`/api/expenses/${expenseId}`, {}, owner.cookie)).status).toBe(200)
    expect((await api(`/api/expenses/${expenseId}`, { method: 'DELETE' }, owner.cookie)).status).toBe(200)
    expect((await api(`/api/expenses/${expenseId}`, {}, owner.cookie)).status).toBe(404)

    const afterDelete = await api(`/api/groups/${groupId}/balances`, {}, owner.cookie)
    const map1 = new Map(afterDelete.body.members.map((m: any) => [m.userId, m.netPaise]))
    expect(map1.get(ownerId)).toBe(0)

    expect((await api(`/api/expenses/${expenseId}/restore`, { method: 'POST' }, owner.cookie)).status).toBe(200)
    expect((await api(`/api/expenses/${expenseId}`, {}, owner.cookie)).status).toBe(200)

    const afterRestore = await api(`/api/groups/${groupId}/balances`, {}, owner.cookie)
    const map2 = new Map(afterRestore.body.members.map((m: any) => [m.userId, m.netPaise]))
    expect(map2.get(ownerId)).toBe(500)
    expect(map2.get(bobId)).toBe(-500)
  })
})

describe('balance reporting', () => {
  it('reports the group balance with the correct sign for both sides', async () => {
    const owner = await authUser('Owner')
    const bob = await authUser('Bob')
    const groupId = await makeGroup(owner, [bob])

    await createExpense(groupId, owner.cookie, {
      description: 'Dinner',
      amountPaise: 1000,
      paidBy: owner.id,
      splitMode: 'equally',
      participants: [{ userId: owner.id }, { userId: bob.id }],
    })

    const ownerGroups = await api('/api/groups', {}, owner.cookie)
    const ownerGroup = ownerGroups.body.groups.find((g: any) => g.id === groupId)
    expect(ownerGroup.balancePaise).toBe(500)

    const bobGroups = await api('/api/groups', {}, bob.cookie)
    const bobGroup = bobGroups.body.groups.find((g: any) => g.id === groupId)
    expect(bobGroup.balancePaise).toBe(-500)
  })

  it('reports the friend balance with the correct sign for both sides', async () => {
    const a = await authUser('A')
    const b = await authUser('B')

    await api('/api/friends/requests', { method: 'POST', body: JSON.stringify({ email: b.email }) }, a.cookie)
    const incoming = await api('/api/friends/requests', {}, b.cookie)
    await api(`/api/friends/requests/${incoming.body.incoming[0].id}/accept`, { method: 'POST' }, b.cookie)

    const groupId = await makeGroup(a, [b])
    await createExpense(groupId, a.cookie, {
      description: 'Dinner',
      amountPaise: 1000,
      paidBy: a.id,
      splitMode: 'equally',
      participants: [{ userId: a.id }, { userId: b.id }],
    })

    const aFriends = await api('/api/friends', {}, a.cookie)
    expect(aFriends.body.friends.find((f: any) => f.id === b.id).balancePaise).toBe(500)

    const bFriends = await api('/api/friends', {}, b.cookie)
    expect(bFriends.body.friends.find((f: any) => f.id === a.id).balancePaise).toBe(-500)
  })
})

describe('analytics', () => {
  it('reflects expense edits and deletions in the monthly summary', async () => {
    const owner = await authUser('Owner')
    const groupId = await makeGroup(owner, [])

    const created = await createExpense(groupId, owner.cookie, {
      description: 'Dinner',
      amountPaise: 1000,
      paidBy: owner.id,
      splitMode: 'equally',
      participants: [{ userId: owner.id }],
      expenseDate: '2026-08-05',
    })
    const expenseId = created.body.expense.id

    let monthly = await api('/api/analytics/monthly?month=2026-08', {}, owner.cookie)
    expect(monthly.body.totalPaise).toBe(1000)

    await api(`/api/expenses/${expenseId}`, { method: 'PATCH', body: JSON.stringify({ amountPaise: 2500 }) }, owner.cookie)
    monthly = await api('/api/analytics/monthly?month=2026-08', {}, owner.cookie)
    expect(monthly.body.totalPaise).toBe(2500)

    await api(`/api/expenses/${expenseId}`, { method: 'DELETE' }, owner.cookie)
    monthly = await api('/api/analytics/monthly?month=2026-08', {}, owner.cookie)
    expect(monthly.body.totalPaise).toBe(0)
  })
})
