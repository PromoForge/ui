export type CampaignStatus = 'running' | 'disabled' | 'expired'

export interface Campaign {
  id: string
  applicationId: string
  applicationName: string
  name: string
  status: CampaignStatus
  updatedAt: string
  updatedBy: string
}
