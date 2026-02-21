import type { Campaign } from '$lib/types'

export const mockRecentCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    applicationId: 'app-1',
    applicationName: 'KSA PRODUCTION',
    name: 'Ramadan Flash Sale 2026',
    status: 'running',
    updatedAt: '2026-02-18T14:32:00Z',
    updatedBy: 'abdulrahman.almutairi'
  },
  {
    id: 'camp-2',
    applicationId: 'app-1',
    applicationName: 'KSA PRODUCTION',
    name: 'New User Welcome Voucher',
    status: 'running',
    updatedAt: '2026-02-17T09:15:00Z',
    updatedBy: 'sara.alharbi'
  },
  {
    id: 'camp-3',
    applicationId: 'app-2',
    applicationName: 'UAE PRODUCTION',
    name: 'Dubai Shopping Festival Bundle',
    status: 'disabled',
    updatedAt: '2026-02-16T17:45:00Z',
    updatedBy: 'omar.hassan'
  },
  {
    id: 'camp-4',
    applicationId: 'app-1',
    applicationName: 'KSA PRODUCTION',
    name: 'Loyalty Tier Upgrade Reward',
    status: 'running',
    updatedAt: '2026-02-15T11:20:00Z',
    updatedBy: 'fatima.alzahrani'
  },
  {
    id: 'camp-5',
    applicationId: 'app-2',
    applicationName: 'UAE PRODUCTION',
    name: 'Free Shipping Weekend',
    status: 'expired',
    updatedAt: '2026-02-14T08:00:00Z',
    updatedBy: 'khalid.ibrahim'
  },
  {
    id: 'camp-6',
    applicationId: 'app-3',
    applicationName: 'KSA SANDBOX',
    name: 'Test: Buy 2 Get 1 Free',
    status: 'running',
    updatedAt: '2026-02-13T16:30:00Z',
    updatedBy: 'abdulrahman.almutairi'
  },
  {
    id: 'camp-7',
    applicationId: 'app-1',
    applicationName: 'KSA PRODUCTION',
    name: 'VIP Early Access Promo',
    status: 'disabled',
    updatedAt: '2026-02-12T10:05:00Z',
    updatedBy: 'noura.alqahtani'
  },
  {
    id: 'camp-8',
    applicationId: 'app-2',
    applicationName: 'UAE PRODUCTION',
    name: 'Refer a Friend Cashback',
    status: 'running',
    updatedAt: '2026-02-11T13:45:00Z',
    updatedBy: 'ahmed.mansour'
  }
]
