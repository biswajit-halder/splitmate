import { describe, expect, it } from 'vitest'
import { computeNet, simplifyDebts } from '../src/lib/balances'

describe('computeNet', () => {
  it('reduces pairwise balances to per-user nets', () => {
    const net = computeNet([
      { user_id: 'a', counterpart_id: 'b', net_amount_paise: 1000 },
      { user_id: 'b', counterpart_id: 'c', net_amount_paise: 500 },
    ])
    expect(net.get('a')).toBe(1000)
    expect(net.get('b')).toBe(-500)
    expect(net.get('c')).toBe(-500)
  })
})

describe('simplifyDebts', () => {
  it('simplifies a 3-person cycle to 2 transactions', () => {
    const net = new Map([
      ['a', 100],
      ['b', -60],
      ['c', -40],
    ])
    const txns = simplifyDebts(net)
    const total = txns.reduce((sum, t) => sum + t.amountPaise, 0)
    expect(total).toBe(100)
    expect(txns.length).toBeLessThanOrEqual(2)
  })

  it('matches largest debit to largest credit', () => {
    const net = new Map([
      ['a', 100],
      ['b', -70],
      ['c', -30],
    ])
    const txns = simplifyDebts(net)
    expect(txns).toContainEqual({ from: 'b', to: 'a', amountPaise: 70 })
    expect(txns).toContainEqual({ from: 'c', to: 'a', amountPaise: 30 })
  })

  it('returns empty set for empty or zero balances', () => {
    expect(simplifyDebts(new Map())).toEqual([])
    expect(simplifyDebts(new Map([['a', 0]]))).toEqual([])
  })
})
