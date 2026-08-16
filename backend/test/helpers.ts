import { SELF } from 'cloudflare:test'

export interface ApiResponse<T = any> {
  status: number
  body: T
  setCookie?: string
}

export async function api(
  path: string,
  init: RequestInit = {},
  cookie?: string
): Promise<ApiResponse> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  if (cookie) headers.set('cookie', cookie)
  const res = await SELF.fetch(`https://splitmate-api.example.com${path}`, { ...init, headers })
  let body: any = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }
  const setCookie = res.headers.get('set-cookie') ?? undefined
  return { status: res.status, body, setCookie }
}

export function extractCookie(setCookie?: string): string | undefined {
  if (!setCookie) return undefined
  return setCookie.split(';')[0]
}

export async function registerUser(email: string, name: string, password = 'password1') {
  return api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
}

export let counter = 0
export function uniqueEmail(): string {
  counter += 1
  return `u${Date.now()}_${counter}@test.dev`
}
