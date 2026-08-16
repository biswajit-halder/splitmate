import { UnauthorizedError } from '../errors/AppError'

const PBKDF2_ITERATIONS = 600_000
const SALT_BYTES = 16
const HASH_BYTES = 32

const enc = new TextEncoder()
const dec = new TextDecoder()

export function toBase64url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function fromBase64url(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    HASH_BYTES * 8
  )
  const hash = new Uint8Array(bits)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64url(salt)}$${toBase64url(hash)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
  const iterations = parseInt(parts[1], 10)
  const salt = fromBase64url(parts[2])
  const expected = fromBase64url(parts[3])
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    expected.length * 8
  )
  const actual = new Uint8Array(bits)
  return constantTimeEqual(actual, expected)
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export interface JwtPayload {
  sub: string
  email: string
  exp: number
  iat: number
}

const JWT_ALG = { name: 'HMAC', hash: 'SHA-256' }

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), JWT_ALG, false, ['sign', 'verify'])
}

async function sign(input: string, secret: string): Promise<string> {
  const key = await getHmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(input))
  return toBase64url(new Uint8Array(sig))
}

export async function signToken(payload: { sub: string; email: string }, secret: string, ttlSeconds = 604800): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const body: JwtPayload = { sub: payload.sub, email: payload.email, iat: now, exp: now + ttlSeconds }
  const header = toBase64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const payloadB64 = toBase64url(enc.encode(JSON.stringify(body)))
  const input = `${header}.${payloadB64}`
  const sig = await sign(input, secret)
  return `${input}.${sig}`
}

export async function verifyToken(token: string, secret: string): Promise<JwtPayload> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new UnauthorizedError('Invalid token')
  const input = `${parts[0]}.${parts[1]}`
  const key = await getHmacKey(secret)
  const valid = await crypto.subtle.verify('HMAC', key, fromBase64url(parts[2]), enc.encode(input))
  if (!valid) throw new UnauthorizedError('Invalid token')
  let body: JwtPayload
  try {
    body = JSON.parse(dec.decode(fromBase64url(parts[1]))) as JwtPayload
  } catch {
    throw new UnauthorizedError('Invalid token')
  }
  if (typeof body.exp !== 'number' || body.exp * 1000 < Date.now()) {
    throw new UnauthorizedError('Token expired')
  }
  return body
}
