import { http } from './client'
import type { User } from '../types'

export const usersApi = {
  me: () => http.get<{ user: User }>('/users/me').then(r => r.user),
  patchMe: (body: { name?: string; avatar_bg?: string; digest_enabled?: boolean }) =>
    http.patch<{ user: User }>('/users/me', body).then(r => r.user),
  changeEmail: (body: { email: string; password: string }) =>
    http.post<{ user: User }>('/users/me/email', body).then(r => r.user),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    http.post<{ user: User }>('/users/me/password', body).then(r => r.user),
}
