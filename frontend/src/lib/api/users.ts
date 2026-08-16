import { http } from './client'
import type { User } from '../types'

export const usersApi = {
  me: () => http.get<{ user: User }>('/users/me').then(r => r.user),
  patchMe: (body: { name?: string; avatar_bg?: string }) =>
    http.patch<{ user: User }>('/users/me', body).then(r => r.user),
}
