/** Human-friendly dates, with no raw ISO strings leaking into the UI. */

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })
const datetimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
})

function parse(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDate(value: string | null | undefined): string {
  const d = parse(value)
  return d ? dateFmt.format(d) : '—'
}

/** "5 Aug 2026" without the year when it is the current year. */
export function formatDateCompact(value: string | null | undefined): string {
  const d = parse(value)
  if (!d) return '—'
  if (d.getFullYear() === new Date().getFullYear()) {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(d)
  }
  return dateFmt.format(d)
}

export function formatDateTime(value: string | null | undefined): string {
  const d = parse(value)
  return d ? datetimeFmt.format(d) : '—'
}

export function formatMonth(month: string): string {
  const d = parse(`${month}-01`)
  return d ? monthFmt.format(d) : month
}

export function relativeTime(value: string | null | undefined): string {
  const d = parse(value)
  if (!d) return '—'
  const seconds = Math.round((Date.now() - d.getTime()) / 1000)
  if (seconds < 0) return 'just now'
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
