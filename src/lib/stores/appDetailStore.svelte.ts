import { getAppDetailData } from '$lib/services/appDetailService'
import type { AppDetailData, CampaignFilterStatus, TimeRange } from '$lib/types'

function createAppDetailStore() {
  let data = $state<AppDetailData | null>(null)
  let loading = $state(false)
  let activeFilters = $state<Set<CampaignFilterStatus>>(new Set())
  let timeRange = $state<TimeRange>('7d')

  async function loadAppDetail(appId: string) {
    loading = true
    try {
      data = await getAppDetailData(appId)
    } finally {
      loading = false
    }
  }

  function toggleFilter(status: CampaignFilterStatus) {
    const next = new Set(activeFilters)
    if (next.has(status)) {
      next.delete(status)
    } else {
      next.add(status)
    }
    activeFilters = next
  }

  function clearFilters() {
    activeFilters = new Set()
  }

  function setTimeRange(range: TimeRange) {
    timeRange = range
  }

  return {
    get data() { return data },
    get loading() { return loading },
    get activeFilters() { return activeFilters },
    get timeRange() { return timeRange },
    loadAppDetail,
    toggleFilter,
    clearFilters,
    setTimeRange
  }
}

export const appDetailStore = createAppDetailStore()
