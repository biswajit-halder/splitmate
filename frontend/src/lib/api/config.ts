// API base URL for the production backend.
// Rolldown v1.x strips URL strings when `import.meta.env.DEV` appears in
// the same module, so we export the bare URL here and handle dev/prod
// routing in the consumer via a runtime hostname check.
export const API_BASE = 'https://splitmate-api.mytrading.workers.dev'
