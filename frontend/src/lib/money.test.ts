import { describe, expect, it } from 'vitest'
import { formatMoney, formatSigned, formatMoneyCompact, fromPaise, toPaise } from './money'

describe('money', () => {
  it('puts the minus sign before the rupee symbol', () => {
    expect(formatMoney(-5351)).toBe('-₹53.51')
    expect(formatMoney(5351)).toBe('₹53.51')
  })

  it('formats signed balances', () => {
    expect(formatSigned(5351)).toBe('+₹53.51')
    expect(formatSigned(-5351)).toBe('-₹53.51')
    expect(formatSigned(0)).toBe('₹0.00')
  })

  it('compacts large amounts', () => {
    expect(formatMoneyCompact(125000)).toBe('₹1.3k')
    expect(formatMoneyCompact(-20000000)).toBe('-₹2.0L')
  })

  it('round-trips paise through rupee strings', () => {
    expect(toPaise('123.45')).toBe(12345)
    expect(fromPaise(12345)).toBe('123.45')
    expect(toPaise(123.45)).toBe(12345)
  })

  it('rejects invalid amounts', () => {
    expect(() => toPaise('12.345')).toThrow()
    expect(() => toPaise('abc')).toThrow()
  })
})
