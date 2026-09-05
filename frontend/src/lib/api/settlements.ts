import { http } from './client'
import type { Settlement } from '../types'

interface RawSettlement {
  id: string
  payerId: string
  payeeId: string
  amountPaise: number
  status: string
  createdAt: string
  note: string | null
  payerName: string
  payeeName: string
}

function mapSettlement(s: RawSettlement, group?: { id: string; name: string }): Settlement {
  return {
    id: s.id,
    groupId: group?.id,
    groupName: group?.name,
    amountPaise: s.amountPaise,
    status: s.status as Settlement['status'],
    date: s.createdAt,
    fromName: s.payerName,
    toName: s.payeeName,
    fromUserId: s.payerId,
    toUserId: s.payeeId,
    note: s.note,
  }
}

export interface CreateSettlementPayload {
  payerId: string
  payeeId: string
  amountPaise: number
  method?: string
  note?: string
}

export const settlementsApi = {
  list: (groupId: string, groupName?: string) =>
    http
      .get<{ settlements: RawSettlement[] }>(`/groups/${groupId}/settlements`)
      .then(({ settlements }) => settlements.map(s => mapSettlement(s, { id: groupId, name: groupName ?? '' }))),
  create: (groupId: string, body: CreateSettlementPayload) =>
    http.post<{ settlement: { id: string } }>(`/groups/${groupId}/settlements`, {
      payerId: body.payerId,
      payeeId: body.payeeId,
      amountPaise: body.amountPaise,
      method: body.method,
      note: body.note,
    }),
  confirm: (id: string) =>
    http.post<{ settlement: { id: string; status: string } }>(`/settlements/${id}/confirm`),
  remove: (id: string) => http.delete<{ ok: true }>(`/settlements/${id}`),
}
