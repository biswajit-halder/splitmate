import { http } from './client'
import type { ExpenseSummary, ExpenseDetail } from '../types'

export type SplitMode = 'equally' | 'exact' | 'percent'

export interface ExpenseParticipant {
  userId: string
  amountPaise?: number
  weight?: number
}

export interface CreateExpensePayload {
  description: string
  amountPaise: number
  expenseDate?: string
  paidBy: string
  splitMode: SplitMode
  participants: ExpenseParticipant[]
  category?: string
}

export const expensesApi = {
  list: (groupId: string) =>
    http.get<{ expenses: ExpenseSummary[] }>(`/groups/${groupId}/expenses`).then(r => r.expenses),
  get: (id: string) => http.get<{ expense: ExpenseDetail }>(`/expenses/${id}`).then(r => r.expense),
  create: (groupId: string, body: CreateExpensePayload) =>
    http.post<{ expense: { id: string } }>(`/groups/${groupId}/expenses`, body),
  update: (id: string, body: Partial<CreateExpensePayload>) =>
    http.patch<{ ok: true }>(`/expenses/${id}`, body),
  remove: (id: string) => http.delete<{ ok: true }>(`/expenses/${id}`),
}
