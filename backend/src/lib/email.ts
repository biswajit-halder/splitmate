import type { AppEnv } from '../types'

/**
 * Optional email delivery via a webhook (e.g. Resend, SendGrid, or an internal
 * relay). Set EMAIL_WEBHOOK_URL as a Worker secret; EMAIL_WEBHOOK_TOKEN is
 * attached as a Bearer token when present. Returns false when unconfigured or
 * when the provider rejects the message.
 */
export async function sendEmail(env: AppEnv['Bindings'], to: string, subject: string, text: string): Promise<boolean> {
  const url = env.EMAIL_WEBHOOK_URL
  if (!url) return false
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(env.EMAIL_WEBHOOK_TOKEN ? { authorization: `Bearer ${env.EMAIL_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({ ...(env.EMAIL_FROM ? { from: env.EMAIL_FROM } : {}), to, subject, text }),
    })
    return res.ok
  } catch {
    return false
  }
}
