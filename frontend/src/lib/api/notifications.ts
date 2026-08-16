import { http } from './client'
import type { NotificationsResult } from '../types'

export const notificationsApi = {
  list: () => http.get<NotificationsResult>('/notifications'),
  markAllRead: () => http.post<{ ok: true }>('/notifications/read'),
  markRead: (id: string) => http.post<{ ok: true }>(`/notifications/${id}/read`),
}
