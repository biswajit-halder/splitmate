import { http } from './client'
import type { Balances, GroupBalances } from '../types'

export const balancesApi = {
  all: () => http.get<Balances>('/balances'),
  group: (groupId: string) => http.get<GroupBalances>(`/groups/${groupId}/balances`),
  simplify: (groupId: string) => http.post<{ transactions: Array<{ from: string; to: string; amountPaise: number }> }>(
    `/groups/${groupId}/simplify-debts`
  ),
}
