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
    { method: 'POST', body: JSON.stringify({ name: 'Group' }) },
    owner.cookie
  )
  const groupId = create.body.group.id
  for (const i of invitees) {
    await api(`/api/groups/${groupId}/invite`, { method: 'POST', body: JSON.stringify({ email: i.email }) }, owner.cookie)
    await api(`/api/groups/${groupId}/join`, { method: 'POST' }, i.cookie)
  }
  return groupId
}

describe('friends', () => {
  it('send → accept → listed as friend', async () => {
    const a = await authUser('A')
    const b = await authUser('B')

    const send = await api('/api/friends/requests', { method: 'POST', body: JSON.stringify({ email: b.email }) }, a.cookie)
    expect(send.status).toBe(201)

    const incoming = await api('/api/friends/requests', {}, b.cookie)
    const requestId = incoming.body.incoming[0].id
    const accept = await api(`/api/friends/requests/${requestId}/accept`, { method: 'POST' }, b.cookie)
    expect(accept.status).toBe(200)

    const friends = await api('/api/friends', {}, a.cookie)
    expect(friends.body.friends.some((f: any) => f.id === b.id)).toBe(true)
  })

  it('self-request → 400 and non-existent accept → 404', async () => {
    const a = await authUser('A')
    const self = await api('/api/friends/requests', { method: 'POST', body: JSON.stringify({ email: a.email }) }, a.cookie)
    expect(self.status).toBe(400)

    const missing = await api('/api/friends/requests/does-not-exist/accept', { method: 'POST' }, a.cookie)
    expect(missing.status).toBe(404)
  })
})

describe('settlements', () => {
  it('dual-confirm completes and moves balances', async () => {
    const payer = await authUser('Payer')
    const payee = await authUser('Payee')
    const groupId = await makeGroup(payer, [payee])

    const create = await api(
      `/api/groups/${groupId}/settlements`,
      { method: 'POST', body: JSON.stringify({ payerId: payer.id, payeeId: payee.id, amountPaise: 1000 }) },
      payer.cookie
    )
    expect(create.status).toBe(201)
    const settlementId = create.body.settlement.id

    const first = await api(`/api/settlements/${settlementId}/confirm`, { method: 'POST' }, payer.cookie)
    expect(first.body.settlement.status).toBe('pending')

    const second = await api(`/api/settlements/${settlementId}/confirm`, { method: 'POST' }, payee.cookie)
    expect(second.body.settlement.status).toBe('completed')

    const balances = await api(`/api/groups/${groupId}/balances`, {}, payer.cookie)
    const byId = new Map(balances.body.members.map((m: any) => [m.userId, m.netPaise]))
    expect(byId.get(payee.id)).toBe(1000)
    expect(byId.get(payer.id)).toBe(-1000)
  })

  it('third-party confirm → 403', async () => {
    const payer = await authUser('Payer')
    const payee = await authUser('Payee')
    const stranger = await authUser('Stranger')
    const groupId = await makeGroup(payer, [payee])

    const create = await api(
      `/api/groups/${groupId}/settlements`,
      { method: 'POST', body: JSON.stringify({ payerId: payer.id, payeeId: payee.id, amountPaise: 500 }) },
      payer.cookie
    )
    const settlementId = create.body.settlement.id
    const third = await api(`/api/settlements/${settlementId}/confirm`, { method: 'POST' }, stranger.cookie)
    expect(third.status).toBe(403)
  })
})

describe('balances + simplify', () => {
  it('simplify-debts returns a minimal set and sums to net', async () => {
    const a = await authUser('A')
    const b = await authUser('B')
    const c = await authUser('C')
    const groupId = await makeGroup(a, [b, c])

    const createExpense = (paidBy: string, amount: number, participants: string[]) =>
      api(
        `/api/groups/${groupId}/expenses`,
        {
          method: 'POST',
          body: JSON.stringify({
            description: 'x',
            amountPaise: amount,
            paidBy,
            splitMode: 'equally',
            participants: participants.map((p) => ({ userId: p })),
          }),
        },
        a.cookie
      )

    await createExpense(a.id, 3000, [a.id, b.id, c.id])
    await createExpense(a.id, 3000, [a.id, b.id, c.id])
    await createExpense(a.id, 3000, [a.id, b.id, c.id])

    const simplify = await api(`/api/groups/${groupId}/simplify-debts`, { method: 'POST' }, a.cookie)
    expect(simplify.status).toBe(200)
    const txns = simplify.body.transactions
    const total = txns.reduce((sum: number, t: any) => sum + t.amountPaise, 0)
    expect(total).toBe(6000)
    expect(txns.length).toBeLessThanOrEqual(2)
  })
})

describe('activity + notifications + analytics', () => {
  it('expense add appears in activity feed', async () => {
    const a = await authUser('A')
    const b = await authUser('B')
    const groupId = await makeGroup(a, [b])
    await api(
      `/api/groups/${groupId}/expenses`,
      {
        method: 'POST',
        body: JSON.stringify({
          description: 'Lunch',
          amountPaise: 1200,
          paidBy: a.id,
          splitMode: 'equally',
          participants: [{ userId: a.id }, { userId: b.id }],
        }),
      },
      a.cookie
    )
    const activity = await api('/api/activity?type=expense_added', {}, a.cookie)
    expect(activity.status).toBe(200)
    expect(activity.body.events.some((e: any) => e.type === 'expense_added')).toBe(true)

    const notifications = await api('/api/notifications', {}, b.cookie)
    expect(notifications.status).toBe(200)
    expect(notifications.body.unread).toBeGreaterThanOrEqual(0)

    const analytics = await api('/api/analytics/monthly', {}, a.cookie)
    expect(analytics.status).toBe(200)
    expect(analytics.body.totalPaise).toBe(1200)
  })
})
