import { getDashboardData } from '$lib/services/dashboardService'
import type { DashboardData, TimeRange } from '$lib/types'

function createDashboardStore() {
  let data = $state<DashboardData | null>(null)
  let timeRange = $state<TimeRange>('30d')
  let loading = $state(false)

  async function loadDashboard(applicationId: string) {
    loading = true
    try {
      data = await getDashboardData(applicationId, timeRange)
    } finally {
      loading = false
    }
  }

  function setTimeRange(range: TimeRange) {
    timeRange = range
  }

  return {
    get data() { return data },
    get timeRange() { return timeRange },
    get loading() { return loading },
    loadDashboard,
    setTimeRange
  }
}

export const dashboardStore = createDashboardStore()
