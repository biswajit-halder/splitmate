export interface ApiErrorDetails {
  [field: string]: string
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: ApiErrorDetails

  constructor(message: string, status: number, code?: string, details?: ApiErrorDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const TOKEN_KEY = 'splitmate_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null

export function onUnauthorized(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler
}

function toCamelKeys<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map(v => toCamelKeys(v)) as unknown as T
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const camel = k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
      out[camel] = toCamelKeys(v)
    }
    return out as T
  }
  return value as T
}

function apiBase(): string {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'
  return base.replace(/\/$/, '')
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  signal?: AbortSignal
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, signal, ...rest } = options
  const url = `${apiBase()}/api${path.startsWith('/') ? path : `/${path}`}`

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  }
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, {
    ...rest,
    signal,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    clearToken()
    unauthorizedHandler?.()
  }

  let data: any = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    const message = (data && (data.error as string)) || `Request failed (${res.status})`
    const code = data && (data.code as string | undefined)
    const details = data && (data.details as ApiErrorDetails | undefined)
    throw new ApiError(message, res.status, code, details)
  }

  return toCamelKeys<T>(data)
}

export const http = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'POST', body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'PATCH', body, signal }),
  delete: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: 'DELETE', signal }),
}
