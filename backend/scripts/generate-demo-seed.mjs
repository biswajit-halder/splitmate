// Generates backend/migrations/0003_seed_demo_users.sql
// Run with: node backend/scripts/generate-demo-seed.mjs
// All 50 demo users share password "demo1234".

import { writeFileSync } from 'node:fs'
import { webcrypto } from 'node:crypto'

const { subtle } = webcrypto

const DEMO_PASSWORD = 'demo1234'
const OUT = new URL('../migrations/0003_seed_demo_users.sql', import.meta.url)

function toB64url(bytes) {
  return Buffer.from(bytes).toString('base64url')
}

async function demoHashParts() {
  const salt = webcrypto.getRandomValues(new Uint8Array(16))
  const key = await subtle.importKey('raw', new TextEncoder().encode(DEMO_PASSWORD), 'PBKDF2', false, ['deriveBits'])
  const bits = await subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, key, 256)
  return { salt: toB64url(salt), hash: toB64url(new Uint8Array(bits)) }
}

const TS = '2026-08-05T12:00:00.000Z'
const MONTH = '2026-08'

const uid = (i) => 'demo-' + String(i).padStart(3, '0')
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

function sq(s) {
  return `'${String(s).replace(/'/g, "''")}'`
}

// ---- Groups (demo001 = user 1 is in every group and is creator) ----
const groups = [
  {
    id: 'demo-group-1',
    name: 'Goa Trip 2026',
    icon: 'beach_access',
    iconBg: 'bg-primary-container',
    iconColor: '#4F46E5',
    type: 'trip',
    members: range(1, 12),
    expenses: [
      { desc: 'Hotel booking', cat: 'Accommodation', amount: 45000, paidBy: 0 },
      { desc: 'Scooter rental', cat: 'Transport', amount: 3200, paidBy: 3 },
      { desc: 'Beach dinner', cat: 'Food', amount: 6800, paidBy: 7 },
      { desc: 'Water sports', cat: 'Entertainment', amount: 9200, paidBy: 2 },
    ],
  },
  {
    id: 'demo-group-2',
    name: 'Apartment 4B',
    icon: 'home',
    iconBg: 'bg-secondary-container',
    iconColor: '#0EA5E9',
    type: 'home',
    members: [1, ...range(13, 24)],
    expenses: [
      { desc: 'Monthly rent', cat: 'Rent', amount: 24000, paidBy: 0 },
      { desc: 'Groceries', cat: 'Groceries', amount: 5400, paidBy: 1 },
      { desc: 'Internet bill', cat: 'Utilities', amount: 1800, paidBy: 8 },
    ],
  },
  {
    id: 'demo-group-3',
    name: 'Office Lunch',
    icon: 'lunch_dining',
    iconBg: 'bg-tertiary-container',
    iconColor: '#22C55E',
    type: 'office',
    members: [1, ...range(25, 36)],
    expenses: [
      { desc: 'Team lunch', cat: 'Food', amount: 3600, paidBy: 0 },
      { desc: 'Coffee run', cat: 'Food', amount: 1200, paidBy: 1 },
      { desc: 'Snacks', cat: 'Food', amount: 900, paidBy: 8 },
    ],
  },
  {
    id: 'demo-group-4',
    name: 'Weekend Gang',
    icon: 'celebration',
    iconBg: 'bg-error-container',
    iconColor: '#EF4444',
    type: 'social',
    members: [1, ...range(37, 48)],
    expenses: [
      { desc: 'Movie tickets', cat: 'Entertainment', amount: 2400, paidBy: 0 },
      { desc: 'Bowling', cat: 'Entertainment', amount: 3000, paidBy: 1 },
      { desc: 'Dinner', cat: 'Food', amount: 5600, paidBy: 8 },
    ],
  },
]

// ---- Friendships ----
// demo001 accepted friends with demo002..demo012 (all in group 1 -> balances show)
const acceptedFriends = []
for (const j of range(2, 12)) acceptedFriends.push([1, j])
// a few extra cross-friendships for realism
;[[2, 3], [3, 4], [13, 14], [25, 26], [37, 38]].forEach((p) => acceptedFriends.push(p))

// Pending requests involving demo001 (so the Requests tab is populated)
const pendingFriends = [
  { requester: 13, addressee: 1 },
  { requester: 14, addressee: 1 },
  { requester: 1, addressee: 15 },
  { requester: 1, addressee: 16 },
]

// ---- Build SQL ----
const stmts = []
const balancesMap = new Map() // key gid|user|counterpart -> amount
const spendingMap = new Map() // key user|month -> amount

function addBalance(gid, creditor, debtor, amount) {
  const key = `${gid}|${creditor}|${debtor}`
  balancesMap.set(key, (balancesMap.get(key) || 0) + amount)
}

// Users (recursive CTE, shared password hash)
const hp = await demoHashParts()
// NOTE: wrangler mangles literal '$' in SQL, so build the hash delimiters
// with char(36) instead of a literal '$'. Stored value is pbkdf2$600000$<salt>$<hash>.
const pwExpr = `'pbkdf2' || char(36) || '600000' || char(36) || ${sq(hp.salt)} || char(36) || ${sq(hp.hash)}`
stmts.push(`
-- 50 demo users. All share password "demo1234".
WITH RECURSIVE cnt(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM cnt WHERE n < 50
),
pw(h) AS ( SELECT ${pwExpr} )
INSERT OR IGNORE INTO users (id, email, password_hash, name, avatar_bg, created_at, updated_at)
SELECT
  'demo-' || substr('000' || n, -3),
  'demo' || substr('000' || n, -3) || '@splitmate.app',
  pw.h,
  'Demo User ' || n,
  CASE (n - 1) % 4 WHEN 0 THEN 'bg-primary-container' WHEN 1 THEN 'bg-secondary-container' WHEN 2 THEN 'bg-tertiary-container' ELSE 'bg-error-container' END,
  datetime('now', '-' || n || ' days'),
  datetime('now', '-' || n || ' days')
FROM cnt, pw;
`)

// Groups + members + expenses
for (const g of groups) {
  stmts.push(
    `INSERT OR IGNORE INTO groups (id, name, icon, icon_bg, icon_color, type, created_by, created_at) VALUES (${sq(g.id)}, ${sq(g.name)}, ${sq(g.icon)}, ${sq(g.iconBg)}, ${sq(g.iconColor)}, ${sq(g.type)}, ${sq(uid(1))}, ${sq(TS)});`
  )
  for (const m of g.members) {
    stmts.push(
      `INSERT OR IGNORE INTO group_members (id, group_id, user_id, status, joined_at) VALUES (${sq(`gm-${g.id}-${m}`)}, ${sq(g.id)}, ${sq(uid(m))}, 'active', ${sq(TS)});`
    )
  }

  g.expenses.forEach((e, ei) => {
    const paidBy = uid(g.members[e.paidBy])
    const n = g.members.length
    const base = Math.floor(e.amount / n)
    const rem = e.amount % n
    const shares = g.members.map((_, i) => base + (i < rem ? 1 : 0))
    const expId = `demo-exp-${g.id}-${ei + 1}`

    stmts.push(
      `INSERT OR IGNORE INTO expenses (id, group_id, paid_by, amount_paise, currency, description, category, split_mode, expense_date, created_at, updated_at) VALUES (${sq(expId)}, ${sq(g.id)}, ${sq(paidBy)}, ${e.amount}, 'INR', ${sq(e.desc)}, ${sq(e.cat)}, 'equally', ${sq('2026-08-05')}, ${sq(TS)}, ${sq(TS)});`
    )
    g.members.forEach((mem, i) => {
      const memId = uid(mem)
      stmts.push(
        `INSERT OR IGNORE INTO expense_splits (id, expense_id, user_id, amount_paise, weight, settled) VALUES (${sq(`es-${expId}-${mem}`)}, ${sq(expId)}, ${sq(memId)}, ${shares[i]}, NULL, 0);`
      )
      if (memId !== paidBy) addBalance(g.id, paidBy, memId, shares[i])
    })
    // spending summary for payer
    const sKey = `${paidBy}|${MONTH}`
    spendingMap.set(sKey, (spendingMap.get(sKey) || 0) + e.amount)
    // activity
    stmts.push(
      `INSERT OR IGNORE INTO activity_events (id, user_id, type, group_id, payload, created_at) VALUES (${sq(`act-${expId}`)}, ${sq(paidBy)}, 'expense_added', ${sq(g.id)}, ${sq(JSON.stringify({ expenseId: expId, amountPaise: e.amount, groupName: g.name, description: e.desc }))}, ${sq(TS)});`
    )
  })
}

// Balances (aggregated, one row per pair)
for (const [key, amount] of balancesMap) {
  const [gid, user, counterpart] = key.split('|')
  stmts.push(
    `INSERT OR IGNORE INTO balances (id, group_id, user_id, counterpart_id, net_amount_paise, updated_at) VALUES (${sq(`bal-${gid}-${user}-${counterpart}`)}, ${sq(gid)}, ${sq(user)}, ${sq(counterpart)}, ${amount}, ${sq(TS)});`
  )
}

// Spending summary
for (const [key, amount] of spendingMap) {
  const [user, month] = key.split('|')
  stmts.push(
    `INSERT OR IGNORE INTO spending_summary_monthly (id, user_id, month, total_paise, settled_paise, updated_at) VALUES (${sq(`ss-${user}-${month}`)}, ${sq(user)}, ${sq(month)}, ${amount}, 0, ${sq(TS)});`
  )
}

// Friend requests (accepted)
let frId = 1
for (const [a, b] of acceptedFriends) {
  stmts.push(
    `INSERT OR IGNORE INTO friend_requests (id, requester_id, addressee_id, status, created_at, updated_at) VALUES (${sq(`fr-${frId++}`)}, ${sq(uid(a))}, ${sq(uid(b))}, 'accepted', ${sq(TS)}, ${sq(TS)});`
  )
}

// Friend requests (pending)
for (const p of pendingFriends) {
  stmts.push(
    `INSERT OR IGNORE INTO friend_requests (id, requester_id, addressee_id, status, created_at, updated_at) VALUES (${sq(`fr-${frId++}`)}, ${sq(uid(p.requester))}, ${sq(uid(p.addressee))}, 'pending', ${sq(TS)}, ${sq(TS)});`
  )
}

// Settlements (completed) in group 1
stmts.push(
  `INSERT OR IGNORE INTO settlements (id, group_id, payer_id, payee_id, amount_paise, method, status, payer_confirmed, payee_confirmed, created_at, updated_at) VALUES (${sq('demo-set-1')}, ${sq('demo-group-1')}, ${sq(uid(1))}, ${sq(uid(2))}, 5000, 'upi', 'completed', 1, 1, ${sq(TS)}, ${sq(TS)});`
)
stmts.push(
  `INSERT OR IGNORE INTO settlements (id, group_id, payer_id, payee_id, amount_paise, method, status, payer_confirmed, payee_confirmed, created_at, updated_at) VALUES (${sq('demo-set-2')}, ${sq('demo-group-1')}, ${sq(uid(3))}, ${sq(uid(1))}, 3000, 'cash', 'completed', 1, 1, ${sq(TS)}, ${sq(TS)});`
)

// Notifications for demo001
stmts.push(
  `INSERT OR IGNORE INTO notifications (id, user_id, title, body, type, ref_id, is_read, created_at) VALUES (${sq('demo-notif-1')}, ${sq(uid(1))}, 'New friend request', 'Demo User 13 wants to connect', 'friend_request', ${sq('fr-100')}, 0, ${sq(TS)});`
)
stmts.push(
  `INSERT OR IGNORE INTO notifications (id, user_id, title, body, type, ref_id, is_read, created_at) VALUES (${sq('demo-notif-2')}, ${sq(uid(1))}, 'Settlement completed', 'You settled up with Demo User 2', 'settlement', ${sq('demo-set-1')}, 0, ${sq(TS)});`
)

const header = `-- SplitMate demo seed: 50 users + groups/expenses/friends/settlements.
-- All demo users share password "${DEMO_PASSWORD}".
-- Idempotent (deterministic ids + INSERT OR IGNORE). Apply via:
--   npx wrangler d1 migrations apply splitmate-db --local

`

writeFileSync(OUT, header + stmts.join('\n') + '\n', 'utf8')
console.log(`Wrote ${OUT.pathname}`)
console.log(`Statements: ${stmts.length}, balances: ${balancesMap.size}, users: 50, groups: ${groups.length}`)
