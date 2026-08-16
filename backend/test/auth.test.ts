import { describe, expect, it } from 'vitest'
import { api, extractCookie, registerUser, uniqueEmail } from './helpers'

describe('auth', () => {
  it('register → me roundtrip', async () => {
    const email = uniqueEmail()
    const reg = await registerUser(email, 'Test User')
    expect(reg.status).toBe(201)
    const cookie = extractCookie(reg.setCookie)
    expect(cookie).toBeDefined()

    const me = await api('/api/users/me', {}, cookie)
    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe(email)
    expect(me.body.user.password_hash).toBeUndefined()
  })

  it('duplicate email → 409', async () => {
    const email = uniqueEmail()
    await registerUser(email, 'First')
    const dup = await registerUser(email, 'Second')
    expect(dup.status).toBe(409)
  })

  it('weak password → 400', async () => {
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: uniqueEmail(), password: 'short', name: 'X' }),
    })
    expect(res.status).toBe(400)
  })

  it('wrong password → 401 and no hash leak', async () => {
    const email = uniqueEmail()
    await registerUser(email, 'Test')
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'wrongpass' }),
    })
    expect(res.status).toBe(401)
    expect(JSON.stringify(res.body)).not.toContain('password_hash')
  })

  it('logout clears the session cookie', async () => {
    const email = uniqueEmail()
    const reg = await registerUser(email, 'Test')
    const cookie = extractCookie(reg.setCookie)!
    const logout = await api('/api/auth/logout', { method: 'POST' }, cookie)
    expect(logout.status).toBe(200)
    expect(logout.setCookie ?? '').toMatch(/Max-Age=0|Expires=/)
    const me = await api('/api/users/me')
    expect(me.status).toBe(401)
  })

  it('/me without cookie → 401', async () => {
    const me = await api('/api/users/me')
    expect(me.status).toBe(401)
  })
})
