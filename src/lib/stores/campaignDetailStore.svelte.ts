import { getCampaignDetail } from '$lib/services/campaignDetailService'
import type { CampaignDetail } from '$lib/types'

function createCampaignDetailStore() {
  let campaign = $state<CampaignDetail | null>(null)
  let loading = $state(false)

  const hasSchedule = $derived(
    campaign?.schedule.startDate !== null || campaign?.schedule.endDate !== null
  )

  const isRunning = $derived(campaign?.status === 'running')

  async function loadCampaign(campaignId: string) {
    loading = true
    try {
      campaign = await getCampaignDetail(campaignId)
    } finally {
      loading = false
    }
  }

  function clear() {
    campaign = null
  }

  return {
    get campaign() {
      return campaign
    },
    get loading() {
      return loading
    },
    get hasSchedule() {
      return hasSchedule
    },
    get isRunning() {
      return isRunning
    },
    loadCampaign,
    clear
  }
}

export const campaignDetailStore = createCampaignDetailStore()
