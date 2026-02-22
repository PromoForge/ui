export type CampaignStatus = 'scheduled' | 'running' | 'disabled' | 'expired'

export interface Campaign {
  id: string
  applicationId: string
  applicationName: string
  name: string
  status: CampaignStatus
  updatedAt: string
  updatedBy: string
}

// --- Campaign List Page types ---

export type CampaignType = 'discount' | 'coupon' | 'loyalty' | 'giveaway'

export type CampaignListFilterStatus = 'scheduled' | 'running' | 'expired' | 'disabled' | 'lowOnBudget' | 'expiringSoon'

export interface CampaignListItem {
  id: string
  applicationId: string
  name: string
  type: CampaignType
  status: CampaignStatus
  store: string
  startDate: string
  endDate: string
  couponRedemptions: number
  totalDiscounts: number
  lastActivity: string
  createdAt: string
  createdBy: string
  archived: boolean
  lowOnBudget: boolean
}
