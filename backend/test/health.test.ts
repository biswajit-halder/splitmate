import { SELF } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

describe('GET /api/health', () => {
  it('returns 200 with JSON { status: "ok" }', async () => {
    const res = await SELF.fetch('https://splitmate-api.example.com/api/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })
})
