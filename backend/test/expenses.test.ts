import { describe, expect, it } from 'vitest'
import { api, extractCookie, registerUser, uniqueEmail } from './helpers'

async function authUser(name: string) {
  const email = uniqueEmail()
  const reg = await registerUser(email, name)
  return { email, cookie: extractCookie(reg.setCookie)! }
}

async function makeGroup(owner: { cookie: string }, invitees: Array<{ email: string; cookie: string }>) {
  const create = await api(
    '/api/groups',
    { method: 'POST', body: JSON.stringify({ name: 'Expense Group' }) },
    owner.cookie
  )
  const groupId = create.body.group.id
  for (const i of invitees) {
    await api(`/api/groups/${groupId}/invite`, { method: 'POST', body: JSON.stringify({ email: i.email }) }, owner.cookie)
    await api(`/api/groups/${groupId}/join`, { method: 'POST' }, i.cookie)
  }
  return groupId
}

describe('expenses', () => {
  it('creates an expense, updates balances, and reverses on delete', async () => {
    const payer = await authUser('Payer')
    const bob = await authUser('Bob')
    const carol = await authUser('Carol')
    const groupId = await makeGroup(payer, [bob, carol])

    const mePayer = await api('/api/users/me', {}, payer.cookie)
    const meBob = await api('/api/users/me', {}, bob.cookie)
    const meCarol = await api('/api/users/me', {}, carol.cookie)
    const payerId = mePayer.body.user.id
    const bobId = meBob.body.user.id
    const carolId = meCarol.body.user.id

    const create = await api(
      `/api/groups/${groupId}/expenses`,
      {
        method: 'POST',
        body: JSON.stringify({
          description: 'Dinner',
          amountPaise: 10000,
          paidBy: payerId,
          splitMode: 'equally',
          participants: [{ userId: payerId }, { userId: bobId }, { userId: carolId }],
        }),
      },
      payer.cookie
    )
    expect(create.status).toBe(201)

    const balances = await api(`/api/groups/${groupId}/balances`, {}, payer.cookie)
    expect(balances.status).toBe(200)
    const byId = new Map(balances.body.members.map((m: any) => [m.userId, m.netPaise]))
    expect(byId.get(payerId)).toBe(6666)
    expect(byId.get(bobId)).toBe(-3333)
    expect(byId.get(carolId)).toBe(-3333)
    expect(balances.body.sumPaise).toBe(0)

    const expenseList = await api(`/api/groups/${groupId}/expenses`, {}, payer.cookie)
    const expenseId = expenseList.body.expenses[0].id

    const del = await api(`/api/expenses/${expenseId}`, { method: 'DELETE' }, payer.cookie)
    expect(del.status).toBe(200)

    const balancesAfter = await api(`/api/groups/${groupId}/balances`, {}, payer.cookie)
    const afterById = new Map(balancesAfter.body.members.map((m: any) => [m.userId, m.netPaise]))
    expect(afterById.get(payerId)).toBe(0)
    expect(afterById.get(bobId)).toBe(0)
    expect(afterById.get(carolId)).toBe(0)
  })

  it('rejects percent splits that do not sum to 100', async () => {
    const payer = await authUser('Payer')
    const bob = await authUser('Bob')
    const groupId = await makeGroup(payer, [bob])
    const mePayer = await api('/api/users/me', {}, payer.cookie)
    const meBob = await api('/api/users/me', {}, bob.cookie)

    const res = await api(
      `/api/groups/${groupId}/expenses`,
      {
        method: 'POST',
        body: JSON.stringify({
          description: 'Bad split',
          amountPaise: 10000,
          paidBy: mePayer.body.user.id,
          splitMode: 'percent',
          participants: [
            { userId: mePayer.body.user.id, weight: 60 },
            { userId: meBob.body.user.id, weight: 30 },
          ],
        }),
      },
      payer.cookie
    )
    expect(res.status).toBe(400)
  })

  it('creates an expense using real user ids', async () => {
    const payer = await authUser('Payer')
    const bob = await authUser('Bob')
    const groupId = await makeGroup(payer, [bob])
    const mePayer = await api('/api/users/me', {}, payer.cookie)
    const meBob = await api('/api/users/me', {}, bob.cookie)

    const create = await api(
      `/api/groups/${groupId}/expenses`,
      {
        method: 'POST',
        body: JSON.stringify({
          description: 'Coffee',
          amountPaise: 500,
          paidBy: mePayer.body.user.id,
          splitMode: 'equally',
          participants: [{ userId: mePayer.body.user.id }, { userId: meBob.body.user.id }],
        }),
      },
      payer.cookie
    )
    expect(create.status).toBe(201)

    const balances = await api(`/api/groups/${groupId}/balances`, {}, payer.cookie)
    const byId = new Map(balances.body.members.map((m: any) => [m.userId, m.netPaise]))
    expect(byId.get(mePayer.body.user.id)).toBe(250)
    expect(byId.get(meBob.body.user.id)).toBe(-250)
  })
})
