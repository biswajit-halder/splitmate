import { describe, expect, it } from 'vitest'
import { api, extractCookie, registerUser, uniqueEmail } from './helpers'

async function authUser(name: string, password = 'password1') {
  const email = uniqueEmail()
  const reg = await registerUser(email, name, password)
  return { email, password, cookie: extractCookie(reg.setCookie)! }
}

describe('account settings', () => {
  it('changes the email with the correct password', async () => {
    const user = await authUser('Email Changer')
    const newEmail = uniqueEmail()

    const res = await api(
      '/api/users/me/email',
      { method: 'POST', body: JSON.stringify({ email: newEmail, password: user.password }) },
      user.cookie
    )
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(newEmail)

    const me = await api('/api/users/me', {}, user.cookie)
    expect(me.body.user.email).toBe(newEmail)
  })

  it('rejects an email change with the wrong password', async () => {
    const user = await authUser('Wrong Password')
    const res = await api(
      '/api/users/me/email',
      { method: 'POST', body: JSON.stringify({ email: uniqueEmail(), password: 'not-the-password' }) },
      user.cookie
    )
    expect(res.status).toBe(401)
  })

  it('rejects an email that is already taken', async () => {
    const a = await authUser('A')
    const b = await authUser('B')

    const res = await api(
      '/api/users/me/email',
      { method: 'POST', body: JSON.stringify({ email: b.email, password: a.password }) },
      a.cookie
    )
    expect(res.status).toBe(409)
  })

  it('changes the password and can log in with the new one', async () => {
    const user = await authUser('Password Changer')

    const res = await api(
      '/api/users/me/password',
      { method: 'POST', body: JSON.stringify({ currentPassword: user.password, newPassword: 'newpassword1' }) },
      user.cookie
    )
    expect(res.status).toBe(200)

    const oldLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: user.password }),
    })
    expect(oldLogin.status).toBe(401)

    const newLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: 'newpassword1' }),
    })
    expect(newLogin.status).toBe(200)
  })

  it('rejects a weak new password', async () => {
    const user = await authUser('Weak Password')
    const res = await api(
      '/api/users/me/password',
      { method: 'POST', body: JSON.stringify({ currentPassword: user.password, newPassword: 'short' }) },
      user.cookie
    )
    expect(res.status).toBe(400)
  })

  it('does not leak the session token in the auth response', async () => {
    const email = uniqueEmail()
    const reg = await registerUser(email, 'No Token')
    expect(reg.body.token).toBeUndefined()
    expect(reg.body.user.email).toBe(email)
  })
})
