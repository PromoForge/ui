import { mockDashboardData } from '$lib/mocks/dashboard'
import type { DashboardData, TimeRange } from '$lib/types'

// GET /v1/applications/:applicationId/dashboard?range=:timeRange
export async function getDashboardData(
  applicationId: string,
  timeRange: TimeRange
): Promise<DashboardData | null> {
  return mockDashboardData[applicationId] ?? null
}
