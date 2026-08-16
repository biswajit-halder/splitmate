import { BadRequestError } from '../errors/AppError'

export type SplitMode = 'equally' | 'exact' | 'percent'

export interface SplitInput {
  amountPaise: number
  mode: SplitMode
  participants: Array<{ userId: string; amountPaise?: number; weight?: number }>
}

export interface SplitResult {
  userId: string
  amountPaise: number
  weight?: number
}

/**
 * Compute per-participant shares in integer paise.
 * - equally: divide as evenly as possible; the first participant absorbs the
 *   remainder paise so the shares always sum exactly to amountPaise.
 * - exact: participant-supplied amounts must sum exactly to amountPaise.
 * - percent: weights must sum to 100; each share is floor(amount*percent/100)
 *   and the remainder is distributed round-robin to the first participants.
 */
export function computeSplits(input: SplitInput): SplitResult[] {
  const { amountPaise, mode, participants } = input
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new BadRequestError('Amount must be a positive integer')
  }
  if (participants.length === 0) throw new BadRequestError('At least one participant is required')
  if (mode === 'exact') return computeExact(amountPaise, participants)
  if (mode === 'percent') return computePercent(amountPaise, participants)
  return computeEqual(amountPaise, participants)
}

function computeEqual(amountPaise: number, participants: SplitInput['participants']): SplitResult[] {
  const count = participants.length
  const base = Math.floor(amountPaise / count)
  const remainder = amountPaise - base * count
  return participants.map((p, i) => ({
    userId: p.userId,
    amountPaise: base + (i < remainder ? 1 : 0),
  }))
}

function computeExact(amountPaise: number, participants: SplitInput['participants']): SplitResult[] {
  const results: SplitResult[] = []
  let sum = 0
  for (const p of participants) {
    const a = p.amountPaise
    if (a === undefined || !Number.isInteger(a) || a < 0) {
      throw new BadRequestError(`Participant ${p.userId} requires a non-negative integer amountPaise`)
    }
    sum += a
    results.push({ userId: p.userId, amountPaise: a })
  }
  if (sum !== amountPaise) {
    throw new BadRequestError(`Exact split amounts must sum to ${amountPaise} paise (got ${sum})`)
  }
  return results
}

function computePercent(amountPaise: number, participants: SplitInput['participants']): SplitResult[] {
  let totalWeight = 0
  for (const p of participants) {
    const w = p.weight
    if (w === undefined || !Number.isInteger(w) || w < 0) {
      throw new BadRequestError(`Participant ${p.userId} requires a non-negative integer weight`)
    }
    totalWeight += w
  }
  if (totalWeight !== 100) {
    throw new BadRequestError(`Percent weights must sum to 100 (got ${totalWeight})`)
  }
  const results = participants.map((p) => ({
    userId: p.userId,
    weight: p.weight,
    amountPaise: Math.floor((amountPaise * (p.weight as number)) / 100),
  }))
  const sum = results.reduce((acc, r) => acc + r.amountPaise, 0)
  let remainder = amountPaise - sum
  let i = 0
  while (remainder > 0) {
    results[i].amountPaise += 1
    remainder -= 1
    i = (i + 1) % results.length
  }
  return results
}
