import { mockCampaignDetails } from '$lib/mocks/campaignDetail'
import type { CampaignDetail } from '$lib/types'

// GET /v1/campaigns/:campaignId
export async function getCampaignDetail(campaignId: string): Promise<CampaignDetail | null> {
  return mockCampaignDetails.find((c) => c.id === campaignId) ?? null
}
