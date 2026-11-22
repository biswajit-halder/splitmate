import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatDate, formatMonth, relativeTime } from './dates'

afterEach(() => vi.useRealTimers())

describe('dates', () => {
  it('formats dates without raw ISO strings', () => {
    expect(formatDate('2026-08-05T12:00:00.000Z')).toMatch(/5 Aug 2026/)
    expect(formatDate(null)).toBe('—')
  })

  it('formats month keys', () => {
    expect(formatMonth('2026-08')).toMatch(/August 2026/)
  })

  it('uses human relative time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-22T12:00:00Z'))
    expect(relativeTime('2026-11-22T11:59:30Z')).toBe('just now')
    expect(relativeTime('2026-11-22T10:00:00Z')).toBe('2h ago')
    expect(relativeTime('2026-11-20T10:00:00Z')).toBe('2d ago')
  })
})
