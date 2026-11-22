import { describe, expect, it } from 'vitest'
import { api, extractCookie, registerUser, uniqueEmail } from './helpers'

async function authUser(name: string) {
  const email = uniqueEmail()
  const reg = await registerUser(email, name)
  const me = await api('/api/users/me', {}, extractCookie(reg.setCookie)!)
  return { email, cookie: extractCookie(reg.setCookie)!, id: me.body.user.id as string }
}

async function makeGroup(owner: ReturnType<typeof authUser> extends Promise<infer T> ? T : never, invitees: Array<{ email: string; cookie: string }>) {
  const created = await api('/api/groups', { method: 'POST', body: JSON.stringify({ name: 'Feature Group', type: 'trip' }) }, owner.cookie)
  const groupId = created.body.group.id as string
  for (const invitee of invitees) {
    await api(`/api/groups/${groupId}/invite`, { method: 'POST', body: JSON.stringify({ email: invitee.email }) }, owner.cookie)
    await api(`/api/groups/${groupId}/join`, { method: 'POST' }, invitee.cookie)
  }
  return groupId
}

describe('split by shares', () => {
  it('splits according to integer ratios', async () => {
    const a = await authUser('A')
    const b = await authUser('B')
    const groupId = await makeGroup(a, [b])
    const created = await api(`/api/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify({
        description: 'Shared', amountPaise: 3000, paidBy: a.id, splitMode: 'shares',
        participants: [{ userId: a.id, shares: 2 }, { userId: b.id, shares: 1 }],
      }),
    }, a.cookie)
    expect(created.status).toBe(201)
    const balances = await api(`/api/groups/${groupId}/balances`, {}, a.cookie)
    const byId = new Map(balances.body.members.map((m: any) => [m.userId, m.netPaise]))
    expect(byId.get(a.id)).toBe(1000)
    expect(byId.get(b.id)).toBe(-1000)
  })
})

describe('settle all', () => {
  it('creates simplified settlements in one call', async () => {
    const a = await authUser('A')
    const b = await authUser('B')
    const groupId = await makeGroup(a, [b])
    await api(`/api/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify({
        description: 'Dinner', amountPaise: 2000, paidBy: a.id, splitMode: 'equally',
        participants: [{ userId: a.id }, { userId: b.id }],
      }),
    }, a.cookie)

    const res = await api(`/api/groups/${groupId}/settlements/settle-all`, { method: 'POST' }, b.cookie)
    expect(res.status).toBe(201)
    expect(res.body.created).toBe(1)

    const list = await api(`/api/groups/${groupId}/settlements`, {}, a.cookie)
    expect(list.body.settlements).toHaveLength(1)
    expect(list.body.settlements[0].amount_paise).toBe(1000)
  })
})

describe('invite links and roles', () => {
  it('lets a new member join by link and promotes them to admin', async () => {
    const owner = await authUser('Owner')
    const member = await authUser('Member')
    const groupId = await makeGroup(owner, [])

    const link = await api(`/api/groups/${groupId}/invite-links`, {
      method: 'POST', body: JSON.stringify({ days: 1 }),
    }, owner.cookie)
    expect(link.status).toBe(201)
    const token = new URL(link.body.url).searchParams.get('token')!

    const joined = await api('/api/groups/join-by-link', {
      method: 'POST', body: JSON.stringify({ token }),
    }, member.cookie)
    expect(joined.status).toBe(200)

    const denied = await api(`/api/groups/${groupId}/invite-links`, {
      method: 'POST', body: '{}',
    }, member.cookie)
    expect(denied.status).toBe(403)

    const promoted = await api(`/api/groups/${groupId}/members/${member.id}`, {
      method: 'PATCH', body: JSON.stringify({ role: 'admin' }),
    }, owner.cookie)
    expect(promoted.status).toBe(200)

    const allowed = await api(`/api/groups/${groupId}/invite-links`, {
      method: 'POST', body: '{}',
    }, member.cookie)
    expect(allowed.status).toBe(201)
  })
})

describe('expense comments', () => {
  it('posts, lists and removes a comment', async () => {
    const a = await authUser('A')
    const b = await authUser('B')
    const groupId = await makeGroup(a, [b])
    const expense = await api(`/api/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify({
        description: 'Lunch', amountPaise: 1000, paidBy: a.id, splitMode: 'equally',
        participants: [{ userId: a.id }, { userId: b.id }],
      }),
    }, a.cookie)
    const expenseId = expense.body.expense.id as string

    expect((await api(`/api/expenses/${expenseId}/comments`, {
      method: 'POST', body: JSON.stringify({ body: 'Was tip included?' }),
    }, b.cookie)).status).toBe(201)

    const list = await api(`/api/expenses/${expenseId}/comments`, {}, a.cookie)
    expect(list.body.comments).toHaveLength(1)
    expect(list.body.comments[0].body).toBe('Was tip included?')

    const commentId = list.body.comments[0].id as string
    expect((await api(`/api/expenses/${expenseId}/comments/${commentId}`, { method: 'DELETE' }, a.cookie)).status).toBe(403)
    expect((await api(`/api/expenses/${expenseId}/comments/${commentId}`, { method: 'DELETE' }, b.cookie)).status).toBe(200)
  })
})

describe('email code sign-in', () => {
  it('registers a brand-new user with a code', async () => {
    const email = uniqueEmail()
    const sent = await api('/api/auth/email/code', { method: 'POST', body: JSON.stringify({ email }) })
    expect(sent.status).toBe(200)
    const code = sent.body.devCode as string
    expect(code).toMatch(/^\d{6}$/)

    const verified = await api('/api/auth/email/verify', {
      method: 'POST', body: JSON.stringify({ email, code }),
    })
    expect(verified.status).toBe(200)
    const cookie = extractCookie(verified.setCookie)!
    const me = await api('/api/users/me', {}, cookie)
    expect(me.body.user.email).toBe(email)

    expect((await api('/api/auth/email/verify', {
      method: 'POST', body: JSON.stringify({ email, code }),
    })).status).toBe(400)
  })
})

describe('balance history', () => {
  it('returns one point per month', async () => {
    const a = await authUser('A')
    const res = await api('/api/analytics/balance-history?months=3', {}, a.cookie)
    expect(res.status).toBe(200)
    expect(res.body.months).toHaveLength(3)
  })
})
