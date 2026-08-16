import { http } from './client'
import type { ActivityEvent } from '../types'

export interface ActivityQuery {
  type?: string
  page?: number
  limit?: number
}

export interface ActivityResult {
  events: ActivityEvent[]
  page: number
  limit: number
  hasMore: boolean
}

export const activityApi = {
  list: (query: ActivityQuery = {}) => {
    const params = new URLSearchParams()
    if (query.type) params.set('type', query.type)
    if (query.page) params.set('page', String(query.page))
    if (query.limit) params.set('limit', String(query.limit))
    const qs = params.toString()
    return http.get<ActivityResult>(`/activity${qs ? `?${qs}` : ''}`)
  },
}
