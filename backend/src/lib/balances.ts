export interface BalanceRow {
  user_id: string
  counterpart_id: string
  net_amount_paise: number
}

export interface NetBalance {
  userId: string
  netPaise: number
}

/** Reduce pairwise balances to a single net amount per user (positive = owed to them). */
export function computeNet(balances: BalanceRow[]): Map<string, number> {
  const net = new Map<string, number>()
  for (const b of balances) {
    const a = net.get(b.user_id) ?? 0
    const c = net.get(b.counterpart_id) ?? 0
    net.set(b.user_id, a + b.net_amount_paise)
    net.set(b.counterpart_id, c - b.net_amount_paise)
  }
  return net
}

export interface Transaction {
  from: string
  to: string
  amountPaise: number
}

/**
 * Greedy minimum-cashflow simplification (O(n log n)).
 * Splits members into creditors (owed money) and debtors, sorts by amount, and
 * matches the largest debit against the largest credit. Produces at most n-1
 * transactions whose net effect is identical to the input balances.
 */
export function simplifyDebts(net: Map<string, number>): Transaction[] {
  const creditors: Array<{ id: string; amount: number }> = []
  const debtors: Array<{ id: string; amount: number }> = []
  for (const [id, amount] of net) {
    if (amount > 0) creditors.push({ id, amount })
    else if (amount < 0) debtors.push({ id, amount: -amount })
  }
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const txns: Transaction[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount)
    if (pay > 0) {
      txns.push({ from: debtors[i].id, to: creditors[j].id, amountPaise: pay })
      debtors[i].amount -= pay
      creditors[j].amount -= pay
    }
    if (debtors[i].amount === 0) i++
    if (creditors[j].amount === 0) j++
  }
  return txns
}
