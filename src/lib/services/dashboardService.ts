import { mockDashboardData } from '$lib/mocks/dashboard'
import type { DashboardData, TimeRange } from '$lib/types'

// GET /v1/applications/:applicationId/dashboard?range=:timeRange
export async function getDashboardData(
  applicationId: string,
  timeRange: TimeRange
): Promise<DashboardData | null> {
  if (mockDashboardData[applicationId]) {
    return mockDashboardData[applicationId]
  }
  // Fall back to rotating through mock datasets for real API IDs
  const datasets = Object.values(mockDashboardData)
  const num = parseInt(applicationId, 10)
  const index = (isNaN(num) ? 0 : Math.abs(num - 1)) % datasets.length
  return datasets[index] ?? datasets[0]
}
