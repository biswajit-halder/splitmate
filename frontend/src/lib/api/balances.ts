import { http } from './client'
import type { Balances, GroupBalances } from '../types'

export const balancesApi = {
  all: () => http.get<Balances>('/balances'),
  group: (groupId: string) => http.get<GroupBalances>(`/groups/${groupId}/balances`),
}
