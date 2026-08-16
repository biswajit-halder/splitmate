import { BadRequestError } from '../errors/AppError'

export function toPaise(amount: number): number {
  if (!Number.isFinite(amount)) throw new BadRequestError('Invalid amount')
  const [intPart, decPart = ''] = amount.toFixed(2).split('.')
  const sign = intPart.startsWith('-') ? -1 : 1
  const int = parseInt(intPart.replace('-', ''), 10)
  const dec = decPart.padEnd(2, '0').slice(0, 2)
  return sign * (int * 100 + parseInt(dec, 10))
}

export function toRupees(paise: number): number {
  return paise / 100
}

export function fromStringPaise(value: string): number {
  if (!/^\d+$/.test(value)) throw new BadRequestError('Invalid integer amount')
  return parseInt(value, 10)
}

export function formatPaise(paise: number): string {
  return (paise / 100).toFixed(2)
}
