import { http } from './client'
import type { AnalyticsMonthly, AnalyticsBreakdown } from '../types'

export const analyticsApi = {
  monthly: (month?: string) =>
    http.get<AnalyticsMonthly>(`/analytics/monthly${month ? `?month=${encodeURIComponent(month)}` : ''}`),
  breakdown: () => http.get<AnalyticsBreakdown>('/analytics/breakdown'),
  trend: (months = 6, from?: string, to?: string) =>
    http.get<{ months: AnalyticsMonthly[] }>(
      `/analytics/trend?months=${months}${from ? `&from=${encodeURIComponent(from)}` : ''}${to ? `&to=${encodeURIComponent(to)}` : ''}`
    ),
  balanceHistory: (months = 6) =>
    http.get<{ months: Array<{ month: string; netPaise: number }> }>(`/analytics/balance-history?months=${months}`),
}
