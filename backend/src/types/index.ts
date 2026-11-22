export interface Bindings {
  DB: D1Database
  JWT_SECRET: string
  APP_ORIGIN: string
  COOKIE_SECURE: string
  COOKIE_SAMESITE?: string
  RATE_LIMIT_DISABLED?: string
  /** Optional email webhook for password resets and settlement reminders. */
  EMAIL_WEBHOOK_URL?: string
  EMAIL_WEBHOOK_TOKEN?: string
  EMAIL_FROM?: string
  /** Dev-only: include the reset token in the API response when no email is configured. */
  DEV_RESET_TOKEN?: string
}

export type Variables = {
  userId: string
}

export type AppEnv = { Bindings: Bindings; Variables: Variables }
