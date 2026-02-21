import type { Application } from '$lib/types'

export const mockApplications: Application[] = [
  {
    id: 'app-1',
    name: 'KSA Production',
    environment: 'live',
    campaignCount: 1975,
    runningCount: 342,
    disabledCount: 1208,
    expiredCount: 425
  },
  {
    id: 'app-2',
    name: 'UAE Production',
    environment: 'live',
    campaignCount: 843,
    runningCount: 156,
    disabledCount: 412,
    expiredCount: 275
  },
  {
    id: 'app-3',
    name: 'KSA Sandbox',
    environment: 'sandbox',
    campaignCount: 47,
    runningCount: 12,
    disabledCount: 20,
    expiredCount: 15
  },
  {
    id: 'app-4',
    name: 'UAE Sandbox',
    environment: 'sandbox',
    campaignCount: 23,
    runningCount: 5,
    disabledCount: 11,
    expiredCount: 7
  }
]
