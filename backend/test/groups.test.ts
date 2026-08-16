import { describe, expect, it } from 'vitest'
import { api, extractCookie, registerUser, uniqueEmail } from './helpers'

async function authUser(name: string) {
  const email = uniqueEmail()
  const reg = await registerUser(email, name)
  return { email, cookie: extractCookie(reg.setCookie)! }
}

describe('groups', () => {
  it('create → list → detail', async () => {
    const owner = await authUser('Owner')
    const create = await api(
      '/api/groups',
      { method: 'POST', body: JSON.stringify({ name: 'Weekend Trip' }) },
      owner.cookie
    )
    expect(create.status).toBe(201)
    const groupId = create.body.group.id

    const list = await api('/api/groups', {}, owner.cookie)
    expect(list.status).toBe(200)
    expect(list.body.groups.some((g: any) => g.id === groupId)).toBe(true)

    const detail = await api(`/api/groups/${groupId}`, {}, owner.cookie)
    expect(detail.status).toBe(200)
    expect(detail.body.group.name).toBe('Weekend Trip')
    expect(detail.body.group.members.length).toBe(1)
  })

  it('non-member GET → 403', async () => {
    const owner = await authUser('Owner')
    const outsider = await authUser('Outsider')
    const create = await api(
      '/api/groups',
      { method: 'POST', body: JSON.stringify({ name: 'Private' }) },
      owner.cookie
    )
    const groupId = create.body.group.id

    const res = await api(`/api/groups/${groupId}`, {}, outsider.cookie)
    expect(res.status).toBe(403)
  })

  it('invite → register → join flow', async () => {
    const owner = await authUser('Owner')
    const inviteeEmail = uniqueEmail()

    const create = await api(
      '/api/groups',
      { method: 'POST', body: JSON.stringify({ name: 'Invite Group' }) },
      owner.cookie
    )
    const groupId = create.body.group.id

    const invite = await api(
      `/api/groups/${groupId}/invite`,
      { method: 'POST', body: JSON.stringify({ email: inviteeEmail }) },
      owner.cookie
    )
    expect(invite.status).toBe(201)

    const invitee = await registerUser(inviteeEmail, 'Invitee')
    const cookie = extractCookie(invitee.setCookie)!

    const join = await api(`/api/groups/${groupId}/join`, { method: 'POST' }, cookie)
    expect(join.status).toBe(200)

    const detail = await api(`/api/groups/${groupId}`, {}, owner.cookie)
    const members = detail.body.group.members
    expect(members.some((m: any) => m.email === inviteeEmail && m.status === 'active')).toBe(true)
  })

  it('owner-only PATCH/DELETE', async () => {
    const owner = await authUser('Owner')
    const other = await authUser('Other')
    const create = await api(
      '/api/groups',
      { method: 'POST', body: JSON.stringify({ name: 'Owner Group' }) },
      owner.cookie
    )
    const groupId = create.body.group.id

    const foreignPatch = await api(
      `/api/groups/${groupId}`,
      { method: 'PATCH', body: JSON.stringify({ name: 'Hacked' }) },
      other.cookie
    )
    expect(foreignPatch.status).toBe(403)

    const del = await api(`/api/groups/${groupId}`, { method: 'DELETE' }, owner.cookie)
    expect(del.status).toBe(200)
  })
})
