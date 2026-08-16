export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}
