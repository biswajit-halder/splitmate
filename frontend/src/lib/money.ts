export function formatMoney(paise: number): string {
  const rupees = paise / 100
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatSigned(paise: number): string {
  const sign = paise < 0 ? '-' : paise > 0 ? '+' : ''
  return `${sign}${formatMoney(Math.abs(paise))}`
}

/** Convert a rupee string/number input into integer paise (string-based to avoid float drift). */
export function toPaise(input: string | number): number {
  const str = typeof input === 'number' ? input.toFixed(2) : input.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    throw new Error('Enter a valid amount')
  }
  const negative = str.startsWith('-')
  const [intPart, decPart = '00'] = str.replace('-', '').split('.')
  const int = parseInt(intPart, 10)
  const dec = decPart.padEnd(2, '0').slice(0, 2)
  const value = int * 100 + parseInt(dec, 10)
  return negative ? -value : value
}
