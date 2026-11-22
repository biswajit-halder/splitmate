import path from 'node:path'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrationsPath = path.join(process.cwd(), 'migrations')
      const migrations = await readD1Migrations(migrationsPath)

      return {
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            RATE_LIMIT_DISABLED: 'true',
            // JWT_SECRET is a production secret (never in wrangler.jsonc vars),
            // so the test pool provides its own throwaway value.
            JWT_SECRET: 'test-only-jwt-secret-that-is-long-enough-0123456789',
            DEV_RESET_TOKEN: 'true',
          },
        },
      }
    }),
  ],
  test: {
    setupFiles: ['./test/apply-migrations.ts'],
  },
})
