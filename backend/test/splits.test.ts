import { describe, expect, it } from 'vitest'
import { computeSplits } from '../src/lib/splits'

const ALICE = 'a'
const BOB = 'b'
const CAROL = 'c'

describe('computeSplits — equal', () => {
  it('divides evenly and gives the remainder to the first participant', () => {
    const result = computeSplits({
      amountPaise: 10000,
      mode: 'equally',
      participants: [{ userId: ALICE }, { userId: BOB }, { userId: CAROL }],
    })
    expect(result.map((r) => r.amountPaise)).toEqual([3334, 3333, 3333])
    expect(result.reduce((sum, r) => sum + r.amountPaise, 0)).toBe(10000)
  })

  it('handles exact divisibility', () => {
    const result = computeSplits({
      amountPaise: 9000,
      mode: 'equally',
      participants: [{ userId: ALICE }, { userId: BOB }, { userId: CAROL }],
    })
    expect(result.map((r) => r.amountPaise)).toEqual([3000, 3000, 3000])
  })

  it('single participant pays everything', () => {
    const result = computeSplits({
      amountPaise: 500,
      mode: 'equally',
      participants: [{ userId: ALICE }],
    })
    expect(result).toEqual([{ userId: ALICE, amountPaise: 500 }])
  })
})

describe('computeSplits — exact', () => {
  it('accepts amounts summing to the total', () => {
    const result = computeSplits({
      amountPaise: 10000,
      mode: 'exact',
      participants: [
        { userId: ALICE, amountPaise: 4000 },
        { userId: BOB, amountPaise: 3500 },
        { userId: CAROL, amountPaise: 2500 },
      ],
    })
    expect(result.reduce((sum, r) => sum + r.amountPaise, 0)).toBe(10000)
  })

  it('rejects amounts that do not sum to the total', () => {
    expect(() =>
      computeSplits({
        amountPaise: 10000,
        mode: 'exact',
        participants: [
          { userId: ALICE, amountPaise: 4000 },
          { userId: BOB, amountPaise: 3500 },
        ],
      })
    ).toThrow()
  })
})

describe('computeSplits — percent', () => {
  it('allocates by weight and fixes rounding remainder', () => {
    const result = computeSplits({
      amountPaise: 10000,
      mode: 'percent',
      participants: [
        { userId: ALICE, weight: 50 },
        { userId: BOB, weight: 30 },
        { userId: CAROL, weight: 20 },
      ],
    })
    expect(result.reduce((sum, r) => sum + r.amountPaise, 0)).toBe(10000)
    expect(result[0].amountPaise).toBe(5000)
  })

  it('rejects weights not summing to 100', () => {
    expect(() =>
      computeSplits({
        amountPaise: 10000,
        mode: 'percent',
        participants: [
          { userId: ALICE, weight: 60 },
          { userId: BOB, weight: 30 },
        ],
      })
    ).toThrow()
  })
})
