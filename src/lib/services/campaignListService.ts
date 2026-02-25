import { mockCampaignList } from "$lib/mocks/campaignList";
import type { CampaignListItem } from "$lib/types";

// GET /v1/applications/:applicationId/campaigns/list
export async function getCampaignList(
  applicationId: string,
): Promise<CampaignListItem[]> {
  return mockCampaignList.filter((c) => c.applicationId === applicationId);
}

// POST /v1/campaigns/:campaignId/clone
export async function cloneCampaign(
  campaignId: string,
  newName: string,
): Promise<CampaignListItem> {
  const original = mockCampaignList.find((c) => c.id === campaignId);
  if (!original) throw new Error(`Campaign ${campaignId} not found`);

  const cloned: CampaignListItem = {
    ...original,
    id: `cl-clone-${Date.now()}`,
    name: newName,
    status: "disabled",
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    archived: false,
    lowOnBudget: false,
  };
  return cloned;
}
