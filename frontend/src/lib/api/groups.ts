import { http } from './client'
import type { Group, GroupDetail, GroupBalances } from '../types'

export interface CreateGroupPayload {
  name: string
  icon?: string
  icon_bg?: string
  icon_color?: string
  type?: string
  currency?: string
}

export const groupsApi = {
  list: () => http.get<{ groups: Group[] }>('/groups').then(r => r.groups),
  get: (id: string) => http.get<{ group: GroupDetail }>(`/groups/${id}`).then(r => r.group),
  create: (body: CreateGroupPayload) => http.post<{ group: Group }>('/groups', body).then(r => r.group),
  update: (id: string, body: CreateGroupPayload) => http.patch<{ ok: true }>(`/groups/${id}`, body),
  remove: (id: string) => http.delete<{ ok: true }>(`/groups/${id}`),
  invite: (id: string, email: string) =>
    http.post<{ invite: { id: string; email: string } }>(`/groups/${id}/invite`, { email }),
  join: (id: string) => http.post<{ ok: true }>(`/groups/${id}/join`),
  balances: (id: string) => http.get<GroupBalances>(`/groups/${id}/balances`),
  leave: (id: string) => http.post<{ ok: true }>(`/groups/${id}/leave`),
  removeMember: (id: string, userId: string) => http.delete<{ ok: true }>(`/groups/${id}/members/${userId}`),
  setMemberRole: (id: string, userId: string, role: 'admin' | 'member') =>
    http.patch<{ ok: true }>(`/groups/${id}/members/${userId}`, { role }),
  createInviteLink: (id: string, maxUses = 0, days = 7) =>
    http.post<{ url: string; expiresAt: string }>(`/groups/${id}/invite-links`, { maxUses, days }),
  inviteLinks: (id: string) =>
    http.get<{ links: Array<{ id: string; expiresAt: string; maxUses: number; uses: number; revoked: boolean }> }>(`/groups/${id}/invite-links`),
  revokeInviteLink: (id: string, linkId: string) =>
    http.delete<{ ok: true }>(`/groups/${id}/invite-links/${linkId}`),
  joinByLink: (token: string) => http.post<{ groupId: string }>('/groups/join-by-link', { token }),
  updateSettings: (id: string, body: { name?: string; accent?: string; photo?: string; removePhoto?: boolean }) =>
    http.patch<{ ok: true }>(`/groups/${id}`, body),
}
