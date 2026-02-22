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

// --- Campaign Detail Page types ---

export interface CampaignRule {
  name: string
  conditions: number
  effects: number
}

export interface CampaignBudget {
  label: string
  type: string
  current: number
  limit: number
  recurrence: string | null
}

export interface CampaignDetail {
  id: string
  applicationId: string
  name: string
  status: CampaignStatus
  description: string
  category: string
  productList: string
  tags: string[]
  rules: CampaignRule[]
  budgets: CampaignBudget[]
  schedule: { startDate: string | null; endDate: string | null }
  lastUpdatedAt: string
  lastUpdatedBy: string
}
