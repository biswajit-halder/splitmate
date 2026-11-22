import { describe, expect, it } from 'vitest'
import { api, extractCookie, registerUser, uniqueEmail } from './helpers'

async function authUser() {
  const email = uniqueEmail()
  const reg = await registerUser(email, 'Security User')
  return { email, cookie: extractCookie(reg.setCookie)! }
}

describe('session invalidation', () => {
  it('changing the password invalidates the existing session', async () => {
    const user = await authUser()
    const before = await api('/api/users/me', {}, user.cookie)
    expect(before.status).toBe(200)

    const change = await api(
      '/api/users/me/password',
      { method: 'POST', body: JSON.stringify({ currentPassword: 'password1', newPassword: 'newpassword1' }) },
      user.cookie
    )
    expect(change.status).toBe(200)

    const after = await api('/api/users/me', {}, user.cookie)
    expect(after.status).toBe(401)

    const login = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: 'newpassword1' }),
    })
    expect(login.status).toBe(200)
  })
})

describe('password reset', () => {
  it('resets the password and invalidates old sessions', async () => {
    const user = await authUser()

    const request = await api('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: user.email }),
    })
    expect(request.status).toBe(200)
    const token = request.body.devToken as string
    expect(token).toBeTruthy()

    const reset = await api('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'resetpassword1' }),
    })
    expect(reset.status).toBe(200)

    expect((await api('/api/users/me', {}, user.cookie)).status).toBe(401)
    const login = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: 'resetpassword1' }),
    })
    expect(login.status).toBe(200)
  })

  it('does not reveal whether an email exists', async () => {
    const known = await api('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody-here-12345@example.com' }),
    })
    expect(known.status).toBe(200)
    expect(known.body.devToken).toBeUndefined()
  })

  it('rejects a reused reset token', async () => {
    const user = await authUser()
    const request = await api('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: user.email }),
    })
    const token = request.body.devToken as string
    expect((await api('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'anotherpass1' }),
    })).status).toBe(200)
    expect((await api('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'anotherpass1' }),
    })).status).toBe(400)
  })
})

describe('origin guard', () => {
  it('rejects cross-origin mutations', async () => {
    const user = await authUser()
    const res = await api('/api/users/me', {
      method: 'PATCH',
      headers: { origin: 'https://evil.example.com' },
      body: JSON.stringify({ name: 'Hacked' }),
    }, user.cookie)
    expect(res.status).toBe(403)
  })
})

describe('trend endpoint', () => {
  it('returns one entry per requested month', async () => {
    const user = await authUser()
    const res = await api('/api/analytics/trend?months=3', {}, user.cookie)
    expect(res.status).toBe(200)
    expect(res.body.months).toHaveLength(3)
    expect(res.body.months[0]).toHaveProperty('totalPaise')
  })
})
