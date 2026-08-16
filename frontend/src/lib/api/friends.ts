import { http } from './client'
import type { Friend, FriendRequest } from '../types'

export const friendsApi = {
  list: () => http.get<{ friends: Friend[] }>('/friends').then(r => r.friends),
  requests: () =>
    http.get<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>('/friends/requests'),
  send: (email: string) =>
    http.post<{ request: { id: string } }>('/friends/requests', { email }),
  accept: (id: string) => http.post<{ ok: true }>(`/friends/requests/${id}/accept`),
  reject: (id: string) => http.post<{ ok: true }>(`/friends/requests/${id}/reject`),
}
