import { mockRecentCampaigns } from "$lib/mocks/campaigns";
import type { Campaign } from "$lib/types";

// GET /v1/campaigns/recent?limit=:limit
export async function getRecentCampaigns(
  limit: number = 10,
): Promise<Campaign[]> {
  return mockRecentCampaigns.slice(0, limit);
}

// GET /v1/applications/:applicationId/campaigns
export async function getCampaignsByApplication(
  applicationId: string,
): Promise<Campaign[]> {
  return mockRecentCampaigns.filter((c) => c.applicationId === applicationId);
}
