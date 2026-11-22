const SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SGD: 'S$', AUD: 'A$',
}

const formatters = new Map<string, Intl.NumberFormat>()
function formatter(currency: string): Intl.NumberFormat {
  let f = formatters.get(currency)
  if (!f) {
    f = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    formatters.set(currency, f)
  }
  return f
}

/** ₹1,234.50 — negative amounts put the minus before the symbol. */
export function formatMoney(paise: number, currency = 'INR'): string {
  const sign = paise < 0 ? '-' : ''
  return `${sign}${SYMBOLS[currency] ?? `${currency} `}${formatter(currency).format(Math.abs(paise) / 100)}`
}

/** +₹1,234.50 / -₹1,234.50 — for balances that need an explicit direction. */
export function formatSigned(paise: number, currency = 'INR'): string {
  const sign = paise > 0 ? '+' : paise < 0 ? '-' : ''
  return `${sign}${formatMoney(Math.abs(paise), currency)}`
}

/** Compact form for dense views: ₹1.2k / ₹12.4k. */
export function formatMoneyCompact(paise: number, currency = 'INR'): string {
  const amount = Math.abs(paise) / 100
  const sign = paise < 0 ? '-' : ''
  const symbol = SYMBOLS[currency] ?? `${currency} `
  if (amount >= 100000) return `${sign}${symbol}${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `${sign}${symbol}${(amount / 1000).toFixed(1)}k`
  return formatMoney(paise, currency)
}

/** Convert integer paise back to a rupee string for form inputs. */
export function fromPaise(paise: number): string {
  return (paise / 100).toFixed(2)
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
