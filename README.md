# SplitMate

Bill splitting and expense tracking app.

**Live app**: https://splitmate.bhalder.workers.dev (API: https://splitmate-api.bhalder.workers.dev)

## Design

- **Night Market** is the default theme: deep plum, coral/mint/saffron/lilac accents, a gradient-mesh + grid background, glass surfaces and restrained glows. A warm **Daylight** light variant is available from the theme toggle.
- **Accent signal**: pick **Ember**, **Ultra** or **Mint** in the sidebar or Profile. The choice is stored in `localStorage` and drives every accent surface at runtime through CSS variables.
- **Layout**: group-first canvas — a statement header, a typographic balance "pulse strip" with six-month sparklines, vivid group covers, an activity timeline and a pairwise settle board with a settlement-progress gauge. Group detail uses an expense **ledger** with a sticky balances rail instead of a stack of cards.
- **Interaction**: command bar with `⌘K` / `Ctrl+K` search, a LIVE activity indicator, responsive bottom navigation on mobile, and full `prefers-reduced-motion` support.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with runtime CSS-variable accents, Fraunces/Karla/JetBrains Mono typography
- **Routing**: React Router v7 (SPA mode), route-based code splitting
- **Backend**: Hono on Cloudflare Workers + D1 (SQLite)
- **Auth**: JWT in an httpOnly cookie (PBKDF2 password hashing)

## Project Structure

```
backend/                 # Cloudflare Worker API (Hono + D1)
├── src/
│   ├── routes/          # HTTP endpoints (auth, groups, expenses, ...)
│   ├── lib/             # Domain logic (splits, balances, membership)
│   ├── middleware/      # auth, cors, rate limiting, error handling
│   └── migrations/      # D1 schema migrations (applied in order)
├── seed/demo_seed.sql   # DEV-ONLY demo data (never a migration)
└── test/                # Vitest (workers pool) unit + integration tests

frontend/                # React SPA
├── src/
│   ├── components/
│   │   ├── ui/          # Buttons, cards, BrandMark, AccentSwitcher, Sparkline, SettleModal…
│   │   └── layout/      # Sidebar, TopBar, SearchDialog, BottomNav
│   ├── context/         # Auth, theme and accent providers
│   ├── lib/
│   │   ├── api/         # Typed API client
│   │   ├── money.ts     # Paise formatting (tabular, sign-safe)
│   │   └── dates.ts     # Human-friendly date/relative-time helpers
│   ├── pages/           # Lazy-loaded page components
│   └── index.css        # Tailwind theme, accents and design tokens
├── public/favicon.svg   # Brand mark
└── wrangler.jsonc       # Cloudflare Workers static assets config
```

## Getting Started

### 1. Backend

```bash
cd backend
npm install

# Create backend/.dev.vars from the template and set a random secret:
cp .dev.vars.example .dev.vars
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# Apply the schema to the local D1 database and start the API
npx wrangler d1 migrations apply splitmate-db --local
npm run dev
```

Optional demo data (50 users, password `demo1234`):

```bash
npm run seed:demo   # applies seed/demo_seed.sql to the LOCAL database only
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server proxies `/api` to the local Worker (see `frontend/vite.config.ts`).

## Environment / Secrets

`JWT_SECRET` is a **secret** and is never committed:

- Local dev: `backend/.dev.vars` (gitignored)
- Production: `npx wrangler secret put JWT_SECRET`

The API fails closed with a `CONFIG_ERROR` if `JWT_SECRET` is missing or shorter
than 32 characters. `backend/wrangler.jsonc` only holds non-secret `vars`
(`APP_ORIGIN`, `COOKIE_SECURE`, `COOKIE_SAMESITE`).

The frontend and API are served from different `workers.dev` subdomains, which
are cross-site, so production requires `COOKIE_SECURE=true` and
`COOKIE_SAMESITE=None` for the session cookie to be sent.

## Production hardening notes

- The in-process rate limiter (`backend/src/middleware/rateLimit.ts`) is
  per-isolate and only a development guard. Add **Cloudflare Rate Limiting
  rules** in the dashboard for `/api/auth/*` and `/api/*` in production.
- `JWT_SECRET` must be set before deploying; the API returns `CONFIG_ERROR`
  and serves no traffic while it is missing.
- Demo accounts exist only in `backend/seed/demo_seed.sql` and are never
  applied by a migration. If demo data was seeded into a production database
  earlier, remove it with:
  `npx wrangler d1 execute splitmate-db --remote --command "DELETE FROM users WHERE email LIKE 'demo%@splitmate.app'"`

## Testing

```bash
cd backend
npm run typecheck
npm test              # 50 tests across 9 files (Vitest + Workers pool)

cd ../frontend
npx tsc --noEmit
npm run build
```

CI (`.github/workflows/ci.yml`) type-checks and tests the backend, and
type-checks and builds the frontend on every push and PR to `main`.

## Deployment

```bash
# Backend (set the secret first, then deploy)
cd backend
npx wrangler secret put JWT_SECRET
npx wrangler d1 migrations apply splitmate-db --remote
npm run deploy

# Frontend
cd frontend
npx wrangler login
npx wrangler deploy
```

## Data model notes

- Money is stored as **integer paise** (1 INR = 100 paise); no floating point.
- `balances` rows are directional: `(user_id, counterpart_id, net_amount_paise)`
  means *the counterpart owes the user that amount*. A user's net position is
  the sum over rows where they are `user_id` (positive) minus rows where they
  are `counterpart_id`.
- Settlements reduce a debt: confirming one books a row for the **payer** in
  favour of the **payee**, which nets the original expense row down to zero.
- Monthly analytics are computed from `expenses`/`settlements` at read time, so
  edits and deletions are always reflected.
- `GET /api/balances` also returns pairwise `counterparties` (positive = they
  owe you) and this month's `settledPaise`, which power the dashboard's settle
  board and progress gauge.

## License

Private
