import { http } from './client'
import type { AuthResult } from '../types'

export interface LoginPayload {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  avatar_bg?: string
  remember?: boolean
}

export const authApi = {
  login: (payload: LoginPayload) => http.post<AuthResult>('/auth/login', payload),
  register: (payload: RegisterPayload) => http.post<AuthResult>('/auth/register', payload),
  logout: () => http.post<{ ok: true }>('/auth/logout'),
}
