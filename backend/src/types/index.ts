export interface Bindings {
  DB: D1Database
  JWT_SECRET: string
  APP_ORIGIN: string
  COOKIE_SECURE: string
  COOKIE_SAMESITE?: string
  RATE_LIMIT_DISABLED?: string
}

export type Variables = {
  userId: string
}

export type AppEnv = { Bindings: Bindings; Variables: Variables }
