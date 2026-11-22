import { http } from './client'
import type { AnalyticsMonthly, AnalyticsBreakdown } from '../types'

export const analyticsApi = {
  monthly: (month?: string) =>
    http.get<AnalyticsMonthly>(`/analytics/monthly${month ? `?month=${encodeURIComponent(month)}` : ''}`),
  breakdown: () => http.get<AnalyticsBreakdown>('/analytics/breakdown'),
  trend: (months = 6) => http.get<{ months: AnalyticsMonthly[] }>(`/analytics/trend?months=${months}`),
}
