# Campaigns Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full campaigns list page at `/applications/[id]/campaigns` with tabs, search, status filters, paginated data table, and clone/template actions.

**Architecture:** Component-decomposed with a dedicated `campaignListStore`. The page is split into 7 new components under `src/lib/components/campaigns/`, backed by new types, mock data, and a service layer. The store manages all state (tab, search, filters, pagination) with chained derived state.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Tailwind CSS v4, TypeScript, Lucide Svelte icons

**Design doc:** `docs/plans/2026-02-22-campaigns-page-design.md`

---

### Task 1: Extend types for campaign list

Add the new `CampaignListItem` type and related types. The existing `Campaign` and `CampaignStatus` types in `campaign.ts` are used by the home page sidebar — keep them and add the new types alongside.

**Files:**
- Modify: `src/lib/types/campaign.ts`
- Verify: `src/lib/types/index.ts` (already re-exports `campaign.ts`)

**Step 1: Add new types to campaign.ts**

Add the following after the existing `Campaign` interface (do NOT remove the existing types):

```typescript
// --- Campaign List Page types ---

export type CampaignType = 'discount' | 'coupon' | 'loyalty' | 'giveaway'

export type CampaignListFilterStatus = 'scheduled' | 'running' | 'expired' | 'disabled' | 'lowOnBudget' | 'expiringSoon'

export interface CampaignListItem {
  id: string
  applicationId: string
  name: string
  type: CampaignType
  status: CampaignStatus | 'scheduled'
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
```

Note: `status` includes `'scheduled'` which is not in the original `CampaignStatus` union. Update the `CampaignStatus` type to include it:

Change line 1 of `src/lib/types/campaign.ts` from:
```typescript
export type CampaignStatus = 'running' | 'disabled' | 'expired'
```
To:
```typescript
export type CampaignStatus = 'scheduled' | 'running' | 'disabled' | 'expired'
```

Then `CampaignListItem.status` can simply be `CampaignStatus`.

**Step 2: Verify types compile**

Run: `bun run check`
Expected: No errors (the existing `Campaign` interface still uses `CampaignStatus` which now includes `'scheduled'` — this is backward compatible since existing mock data only uses `'running' | 'disabled' | 'expired'`).

**Step 3: Commit**

```bash
git add src/lib/types/campaign.ts
git commit -m "feat: add CampaignListItem type and extend CampaignStatus"
```

---

### Task 2: Create mock campaign list data

Generate ~50 realistic `CampaignListItem` entries covering all statuses, types, and edge cases.

**Files:**
- Create: `src/lib/mocks/campaignList.ts`

**Step 1: Create the mock data file**

```typescript
// src/lib/mocks/campaignList.ts
import type { CampaignListItem } from '$lib/types'

export const mockCampaignList: CampaignListItem[] = [
  // --- Scheduled (5) ---
  {
    id: 'cl-001',
    applicationId: 'app-1',
    name: 'Ramadan Mega Sale 2026',
    type: 'discount',
    status: 'scheduled',
    store: 'All Stores',
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-03-31T23:59:59Z',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: '2026-02-20T10:30:00Z',
    createdAt: '2026-02-15T09:00:00Z',
    createdBy: 'abdulrahman.almutairi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-002',
    applicationId: 'app-1',
    name: 'Spring Collection Launch',
    type: 'coupon',
    status: 'scheduled',
    store: 'Riyadh Flagship',
    startDate: '2026-03-15T00:00:00Z',
    endDate: '2026-04-15T23:59:59Z',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: '2026-02-18T14:20:00Z',
    createdAt: '2026-02-10T11:00:00Z',
    createdBy: 'sara.alharbi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-003',
    applicationId: 'app-1',
    name: 'Employee Appreciation Week',
    type: 'giveaway',
    status: 'scheduled',
    store: 'HQ Store',
    startDate: '2026-03-10T00:00:00Z',
    endDate: '2026-03-17T23:59:59Z',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: '2026-02-19T16:00:00Z',
    createdAt: '2026-02-12T08:30:00Z',
    createdBy: 'fatima.alzahrani',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-004',
    applicationId: 'app-1',
    name: 'VIP Early Access Spring',
    type: 'loyalty',
    status: 'scheduled',
    store: 'Online',
    startDate: '2026-03-05T00:00:00Z',
    endDate: '2026-03-12T23:59:59Z',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: '2026-02-21T09:15:00Z',
    createdAt: '2026-02-14T10:00:00Z',
    createdBy: 'khalid.ibrahim',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-005',
    applicationId: 'app-1',
    name: 'Weekend Flash Deal',
    type: 'discount',
    status: 'scheduled',
    store: 'All Stores',
    startDate: '2026-02-28T00:00:00Z',
    endDate: '2026-03-02T23:59:59Z',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: '2026-02-22T08:00:00Z',
    createdAt: '2026-02-20T15:30:00Z',
    createdBy: 'omar.hassan',
    archived: false,
    lowOnBudget: false
  },

  // --- Running (15) ---
  {
    id: 'cl-006',
    applicationId: 'app-1',
    name: 'New User Welcome Voucher',
    type: 'coupon',
    status: 'running',
    store: 'All Stores',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-06-30T23:59:59Z',
    couponRedemptions: 4523,
    totalDiscounts: 135690,
    lastActivity: '2026-02-22T11:45:00Z',
    createdAt: '2025-12-20T10:00:00Z',
    createdBy: 'sara.alharbi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-007',
    applicationId: 'app-1',
    name: 'Loyalty Tier Upgrade Reward',
    type: 'loyalty',
    status: 'running',
    store: 'All Stores',
    startDate: '2026-01-15T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    couponRedemptions: 1876,
    totalDiscounts: 93800,
    lastActivity: '2026-02-22T10:30:00Z',
    createdAt: '2026-01-10T14:00:00Z',
    createdBy: 'abdulrahman.almutairi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-008',
    applicationId: 'app-1',
    name: 'Free Shipping Over SAR 200',
    type: 'discount',
    status: 'running',
    store: 'Online',
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-02-28T23:59:59Z',
    couponRedemptions: 2341,
    totalDiscounts: 70230,
    lastActivity: '2026-02-22T09:00:00Z',
    createdAt: '2026-01-28T11:30:00Z',
    createdBy: 'noura.alqahtani',
    archived: false,
    lowOnBudget: true
  },
  {
    id: 'cl-009',
    applicationId: 'app-1',
    name: 'Buy 2 Get 1 Free Electronics',
    type: 'discount',
    status: 'running',
    store: 'Jeddah Mall',
    startDate: '2026-02-10T00:00:00Z',
    endDate: '2026-02-25T23:59:59Z',
    couponRedemptions: 567,
    totalDiscounts: 283500,
    lastActivity: '2026-02-21T17:00:00Z',
    createdAt: '2026-02-05T09:00:00Z',
    createdBy: 'ahmed.mansour',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-010',
    applicationId: 'app-1',
    name: 'Refer a Friend Cashback',
    type: 'coupon',
    status: 'running',
    store: 'All Stores',
    startDate: '2025-11-01T00:00:00Z',
    endDate: '2026-04-30T23:59:59Z',
    couponRedemptions: 8934,
    totalDiscounts: 446700,
    lastActivity: '2026-02-22T12:15:00Z',
    createdAt: '2025-10-20T08:00:00Z',
    createdBy: 'khalid.ibrahim',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-011',
    applicationId: 'app-1',
    name: 'Student Discount 15%',
    type: 'discount',
    status: 'running',
    store: 'Online',
    startDate: '2026-01-20T00:00:00Z',
    endDate: '2026-05-31T23:59:59Z',
    couponRedemptions: 3210,
    totalDiscounts: 160500,
    lastActivity: '2026-02-21T14:30:00Z',
    createdAt: '2026-01-15T13:00:00Z',
    createdBy: 'fatima.alzahrani',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-012',
    applicationId: 'app-1',
    name: 'Birthday Month Special',
    type: 'loyalty',
    status: 'running',
    store: 'All Stores',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    couponRedemptions: 1245,
    totalDiscounts: 62250,
    lastActivity: '2026-02-20T16:45:00Z',
    createdAt: '2025-12-15T10:00:00Z',
    createdBy: 'sara.alharbi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-013',
    applicationId: 'app-1',
    name: 'Flash Sale Fridays',
    type: 'discount',
    status: 'running',
    store: 'Riyadh Flagship',
    startDate: '2026-02-07T00:00:00Z',
    endDate: '2026-02-28T23:59:59Z',
    couponRedemptions: 789,
    totalDiscounts: 39450,
    lastActivity: '2026-02-21T20:00:00Z',
    createdAt: '2026-02-03T09:30:00Z',
    createdBy: 'omar.hassan',
    archived: false,
    lowOnBudget: true
  },
  {
    id: 'cl-014',
    applicationId: 'app-1',
    name: 'App Download Bonus',
    type: 'coupon',
    status: 'running',
    store: 'Online',
    startDate: '2026-01-10T00:00:00Z',
    endDate: '2026-03-31T23:59:59Z',
    couponRedemptions: 5672,
    totalDiscounts: 113440,
    lastActivity: '2026-02-22T07:30:00Z',
    createdAt: '2026-01-05T12:00:00Z',
    createdBy: 'noura.alqahtani',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-015',
    applicationId: 'app-1',
    name: 'Bundle Deal: Home & Kitchen',
    type: 'discount',
    status: 'running',
    store: 'Dammam Branch',
    startDate: '2026-02-15T00:00:00Z',
    endDate: '2026-03-15T23:59:59Z',
    couponRedemptions: 345,
    totalDiscounts: 172500,
    lastActivity: '2026-02-21T11:00:00Z',
    createdAt: '2026-02-10T14:30:00Z',
    createdBy: 'abdulrahman.almutairi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-016',
    applicationId: 'app-1',
    name: 'Clearance Sale Winter Items',
    type: 'discount',
    status: 'running',
    store: 'All Stores',
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-02-28T23:59:59Z',
    couponRedemptions: 4100,
    totalDiscounts: 615000,
    lastActivity: '2026-02-22T08:45:00Z',
    createdAt: '2026-01-30T16:00:00Z',
    createdBy: 'ahmed.mansour',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-017',
    applicationId: 'app-1',
    name: 'First Purchase 20% Off',
    type: 'coupon',
    status: 'running',
    store: 'Online',
    startDate: '2025-06-01T00:00:00Z',
    endDate: '2026-05-31T23:59:59Z',
    couponRedemptions: 12340,
    totalDiscounts: 987200,
    lastActivity: '2026-02-22T13:00:00Z',
    createdAt: '2025-05-20T09:00:00Z',
    createdBy: 'khalid.ibrahim',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-018',
    applicationId: 'app-1',
    name: 'Giveaway: Win a Trip',
    type: 'giveaway',
    status: 'running',
    store: 'All Stores',
    startDate: '2026-02-14T00:00:00Z',
    endDate: '2026-03-14T23:59:59Z',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: '2026-02-21T19:00:00Z',
    createdAt: '2026-02-10T08:00:00Z',
    createdBy: 'sara.alharbi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-019',
    applicationId: 'app-1',
    name: 'Double Points Weekend',
    type: 'loyalty',
    status: 'running',
    store: 'All Stores',
    startDate: '2026-02-20T00:00:00Z',
    endDate: '2026-02-23T23:59:59Z',
    couponRedemptions: 2100,
    totalDiscounts: 0,
    lastActivity: '2026-02-22T14:00:00Z',
    createdAt: '2026-02-18T10:00:00Z',
    createdBy: 'fatima.alzahrani',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-020',
    applicationId: 'app-1',
    name: 'SAR 50 Off SAR 300+',
    type: 'coupon',
    status: 'running',
    store: 'Online',
    startDate: '2026-02-10T00:00:00Z',
    endDate: '2026-02-24T23:59:59Z',
    couponRedemptions: 1890,
    totalDiscounts: 94500,
    lastActivity: '2026-02-22T06:30:00Z',
    createdAt: '2026-02-08T11:00:00Z',
    createdBy: 'omar.hassan',
    archived: false,
    lowOnBudget: true
  },

  // --- Expired (20) ---
  {
    id: 'cl-021',
    applicationId: 'app-1',
    name: 'National Day Sale 2025',
    type: 'discount',
    status: 'expired',
    store: 'All Stores',
    startDate: '2025-09-20T00:00:00Z',
    endDate: '2025-09-25T23:59:59Z',
    couponRedemptions: 15600,
    totalDiscounts: 1560000,
    lastActivity: '2025-09-25T23:59:59Z',
    createdAt: '2025-09-10T08:00:00Z',
    createdBy: 'abdulrahman.almutairi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-022',
    applicationId: 'app-1',
    name: 'Black Friday 2025',
    type: 'discount',
    status: 'expired',
    store: 'All Stores',
    startDate: '2025-11-25T00:00:00Z',
    endDate: '2025-11-30T23:59:59Z',
    couponRedemptions: 23400,
    totalDiscounts: 4680000,
    lastActivity: '2025-11-30T23:59:59Z',
    createdAt: '2025-11-01T10:00:00Z',
    createdBy: 'sara.alharbi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-023',
    applicationId: 'app-1',
    name: 'White Friday Deals',
    type: 'coupon',
    status: 'expired',
    store: 'Online',
    startDate: '2025-11-20T00:00:00Z',
    endDate: '2025-11-27T23:59:59Z',
    couponRedemptions: 8760,
    totalDiscounts: 438000,
    lastActivity: '2025-11-27T23:59:59Z',
    createdAt: '2025-11-10T09:00:00Z',
    createdBy: 'khalid.ibrahim',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-024',
    applicationId: 'app-1',
    name: 'Christmas Sale 2025',
    type: 'discount',
    status: 'expired',
    store: 'All Stores',
    startDate: '2025-12-20T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    couponRedemptions: 11200,
    totalDiscounts: 896000,
    lastActivity: '2025-12-31T23:59:59Z',
    createdAt: '2025-12-10T12:00:00Z',
    createdBy: 'ahmed.mansour',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-025',
    applicationId: 'app-1',
    name: 'New Year Countdown',
    type: 'giveaway',
    status: 'expired',
    store: 'Riyadh Flagship',
    startDate: '2025-12-28T00:00:00Z',
    endDate: '2026-01-02T23:59:59Z',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: '2026-01-02T23:59:59Z',
    createdAt: '2025-12-20T15:00:00Z',
    createdBy: 'noura.alqahtani',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-026',
    applicationId: 'app-1',
    name: 'Back to School 2025',
    type: 'discount',
    status: 'expired',
    store: 'All Stores',
    startDate: '2025-08-15T00:00:00Z',
    endDate: '2025-09-05T23:59:59Z',
    couponRedemptions: 9800,
    totalDiscounts: 490000,
    lastActivity: '2025-09-05T23:59:59Z',
    createdAt: '2025-08-01T08:00:00Z',
    createdBy: 'fatima.alzahrani',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-027',
    applicationId: 'app-1',
    name: 'Summer Clearance 2025',
    type: 'discount',
    status: 'expired',
    store: 'All Stores',
    startDate: '2025-07-01T00:00:00Z',
    endDate: '2025-08-15T23:59:59Z',
    couponRedemptions: 18500,
    totalDiscounts: 2775000,
    lastActivity: '2025-08-15T23:59:59Z',
    createdAt: '2025-06-20T10:00:00Z',
    createdBy: 'omar.hassan',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-028',
    applicationId: 'app-1',
    name: 'Founding Day Celebration',
    type: 'giveaway',
    status: 'expired',
    store: 'All Stores',
    startDate: '2025-02-20T00:00:00Z',
    endDate: '2025-02-23T23:59:59Z',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: '2025-02-23T23:59:59Z',
    createdAt: '2025-02-10T09:00:00Z',
    createdBy: 'abdulrahman.almutairi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-029',
    applicationId: 'app-1',
    name: 'Valentine Day Promo',
    type: 'coupon',
    status: 'expired',
    store: 'Online',
    startDate: '2026-02-10T00:00:00Z',
    endDate: '2026-02-15T23:59:59Z',
    couponRedemptions: 3400,
    totalDiscounts: 170000,
    lastActivity: '2026-02-15T23:59:59Z',
    createdAt: '2026-02-01T10:00:00Z',
    createdBy: 'sara.alharbi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-030',
    applicationId: 'app-1',
    name: 'January Clearance',
    type: 'discount',
    status: 'expired',
    store: 'Jeddah Mall',
    startDate: '2026-01-05T00:00:00Z',
    endDate: '2026-01-31T23:59:59Z',
    couponRedemptions: 6700,
    totalDiscounts: 335000,
    lastActivity: '2026-01-31T23:59:59Z',
    createdAt: '2025-12-28T14:00:00Z',
    createdBy: 'khalid.ibrahim',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-031',
    applicationId: 'app-1',
    name: 'Eid Al Fitr 2025',
    type: 'discount',
    status: 'expired',
    store: 'All Stores',
    startDate: '2025-03-28T00:00:00Z',
    endDate: '2025-04-05T23:59:59Z',
    couponRedemptions: 21000,
    totalDiscounts: 3150000,
    lastActivity: '2025-04-05T23:59:59Z',
    createdAt: '2025-03-15T08:00:00Z',
    createdBy: 'ahmed.mansour',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-032',
    applicationId: 'app-1',
    name: 'Eid Al Adha 2025',
    type: 'discount',
    status: 'expired',
    store: 'All Stores',
    startDate: '2025-06-05T00:00:00Z',
    endDate: '2025-06-12T23:59:59Z',
    couponRedemptions: 19500,
    totalDiscounts: 2925000,
    lastActivity: '2025-06-12T23:59:59Z',
    createdAt: '2025-05-25T10:00:00Z',
    createdBy: 'fatima.alzahrani',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-033',
    applicationId: 'app-1',
    name: 'Weekend Flash Jan W1',
    type: 'discount',
    status: 'expired',
    store: 'Riyadh Flagship',
    startDate: '2026-01-02T00:00:00Z',
    endDate: '2026-01-04T23:59:59Z',
    couponRedemptions: 450,
    totalDiscounts: 22500,
    lastActivity: '2026-01-04T23:59:59Z',
    createdAt: '2025-12-30T09:00:00Z',
    createdBy: 'noura.alqahtani',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-034',
    applicationId: 'app-1',
    name: 'Weekend Flash Jan W2',
    type: 'discount',
    status: 'expired',
    store: 'Riyadh Flagship',
    startDate: '2026-01-09T00:00:00Z',
    endDate: '2026-01-11T23:59:59Z',
    couponRedemptions: 520,
    totalDiscounts: 26000,
    lastActivity: '2026-01-11T23:59:59Z',
    createdAt: '2026-01-06T09:00:00Z',
    createdBy: 'noura.alqahtani',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-035',
    applicationId: 'app-1',
    name: 'Mid-Year Sale 2025',
    type: 'discount',
    status: 'expired',
    store: 'All Stores',
    startDate: '2025-06-15T00:00:00Z',
    endDate: '2025-06-30T23:59:59Z',
    couponRedemptions: 14200,
    totalDiscounts: 2130000,
    lastActivity: '2025-06-30T23:59:59Z',
    createdAt: '2025-06-01T08:00:00Z',
    createdBy: 'omar.hassan',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-036',
    applicationId: 'app-1',
    name: 'Mothers Day Special',
    type: 'coupon',
    status: 'expired',
    store: 'Online',
    startDate: '2025-03-18T00:00:00Z',
    endDate: '2025-03-22T23:59:59Z',
    couponRedemptions: 2800,
    totalDiscounts: 140000,
    lastActivity: '2025-03-22T23:59:59Z',
    createdAt: '2025-03-10T10:00:00Z',
    createdBy: 'sara.alharbi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-037',
    applicationId: 'app-1',
    name: 'Loyalty Week Feb 2026',
    type: 'loyalty',
    status: 'expired',
    store: 'All Stores',
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-02-07T23:59:59Z',
    couponRedemptions: 4500,
    totalDiscounts: 0,
    lastActivity: '2026-02-07T23:59:59Z',
    createdAt: '2026-01-25T12:00:00Z',
    createdBy: 'abdulrahman.almutairi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-038',
    applicationId: 'app-1',
    name: 'Winter Warm-Up Sale',
    type: 'discount',
    status: 'expired',
    store: 'Dammam Branch',
    startDate: '2025-12-01T00:00:00Z',
    endDate: '2025-12-15T23:59:59Z',
    couponRedemptions: 3200,
    totalDiscounts: 160000,
    lastActivity: '2025-12-15T23:59:59Z',
    createdAt: '2025-11-25T09:00:00Z',
    createdBy: 'ahmed.mansour',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-039',
    applicationId: 'app-1',
    name: 'Singles Day 11.11',
    type: 'discount',
    status: 'expired',
    store: 'Online',
    startDate: '2025-11-11T00:00:00Z',
    endDate: '2025-11-12T23:59:59Z',
    couponRedemptions: 7800,
    totalDiscounts: 780000,
    lastActivity: '2025-11-12T23:59:59Z',
    createdAt: '2025-11-01T08:00:00Z',
    createdBy: 'khalid.ibrahim',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-040',
    applicationId: 'app-1',
    name: 'Oct Fest Sale',
    type: 'discount',
    status: 'expired',
    store: 'Jeddah Mall',
    startDate: '2025-10-01T00:00:00Z',
    endDate: '2025-10-15T23:59:59Z',
    couponRedemptions: 5400,
    totalDiscounts: 270000,
    lastActivity: '2025-10-15T23:59:59Z',
    createdAt: '2025-09-20T10:00:00Z',
    createdBy: 'fatima.alzahrani',
    archived: false,
    lowOnBudget: false
  },

  // --- Disabled (10) ---
  {
    id: 'cl-041',
    applicationId: 'app-1',
    name: 'Old Loyalty Program v1',
    type: 'loyalty',
    status: 'disabled',
    store: 'All Stores',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    couponRedemptions: 34000,
    totalDiscounts: 0,
    lastActivity: '2025-06-15T10:00:00Z',
    createdAt: '2024-12-15T08:00:00Z',
    createdBy: 'abdulrahman.almutairi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-042',
    applicationId: 'app-1',
    name: 'Test Campaign - DO NOT USE',
    type: 'discount',
    status: 'disabled',
    store: 'HQ Store',
    startDate: '2025-03-01T00:00:00Z',
    endDate: '2025-03-31T23:59:59Z',
    couponRedemptions: 12,
    totalDiscounts: 600,
    lastActivity: '2025-03-05T14:00:00Z',
    createdAt: '2025-03-01T09:00:00Z',
    createdBy: 'omar.hassan',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-043',
    applicationId: 'app-1',
    name: 'Paused: Summer Promo Draft',
    type: 'discount',
    status: 'disabled',
    store: 'All Stores',
    startDate: '2025-06-01T00:00:00Z',
    endDate: '2025-08-31T23:59:59Z',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: '2025-05-20T16:00:00Z',
    createdAt: '2025-05-15T10:00:00Z',
    createdBy: 'sara.alharbi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-044',
    applicationId: 'app-1',
    name: 'Disabled: Flash Sale Template',
    type: 'coupon',
    status: 'disabled',
    store: 'Online',
    startDate: '2025-04-01T00:00:00Z',
    endDate: '2025-04-30T23:59:59Z',
    couponRedemptions: 2300,
    totalDiscounts: 115000,
    lastActivity: '2025-04-10T12:00:00Z',
    createdAt: '2025-03-25T08:00:00Z',
    createdBy: 'khalid.ibrahim',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-045',
    applicationId: 'app-1',
    name: 'Halted: Giveaway Q3',
    type: 'giveaway',
    status: 'disabled',
    store: 'Riyadh Flagship',
    startDate: '2025-07-01T00:00:00Z',
    endDate: '2025-09-30T23:59:59Z',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: '2025-07-15T14:00:00Z',
    createdAt: '2025-06-25T09:00:00Z',
    createdBy: 'noura.alqahtani',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-046',
    applicationId: 'app-1',
    name: 'Inactive: Bundle Deal v2',
    type: 'discount',
    status: 'disabled',
    store: 'Jeddah Mall',
    startDate: '2025-08-01T00:00:00Z',
    endDate: '2025-10-31T23:59:59Z',
    couponRedemptions: 890,
    totalDiscounts: 44500,
    lastActivity: '2025-08-20T10:00:00Z',
    createdAt: '2025-07-28T11:00:00Z',
    createdBy: 'ahmed.mansour',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-047',
    applicationId: 'app-1',
    name: 'Suspended: Referral Program',
    type: 'coupon',
    status: 'disabled',
    store: 'All Stores',
    startDate: '2025-05-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    couponRedemptions: 6700,
    totalDiscounts: 335000,
    lastActivity: '2025-09-01T08:00:00Z',
    createdAt: '2025-04-20T10:00:00Z',
    createdBy: 'fatima.alzahrani',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-048',
    applicationId: 'app-1',
    name: 'Paused: Loyalty Bonus x2',
    type: 'loyalty',
    status: 'disabled',
    store: 'All Stores',
    startDate: '2025-09-01T00:00:00Z',
    endDate: '2025-11-30T23:59:59Z',
    couponRedemptions: 1500,
    totalDiscounts: 0,
    lastActivity: '2025-10-01T12:00:00Z',
    createdAt: '2025-08-25T14:00:00Z',
    createdBy: 'omar.hassan',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-049',
    applicationId: 'app-1',
    name: 'Draft: Spring Collection 2026',
    type: 'discount',
    status: 'disabled',
    store: 'Online',
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-04-30T23:59:59Z',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: '2026-02-20T09:00:00Z',
    createdAt: '2026-02-18T10:00:00Z',
    createdBy: 'sara.alharbi',
    archived: false,
    lowOnBudget: false
  },
  {
    id: 'cl-050',
    applicationId: 'app-1',
    name: 'Off: Regional Promo East',
    type: 'discount',
    status: 'disabled',
    store: 'Dammam Branch',
    startDate: '2025-10-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    couponRedemptions: 2100,
    totalDiscounts: 105000,
    lastActivity: '2025-11-15T16:00:00Z',
    createdAt: '2025-09-25T08:00:00Z',
    createdBy: 'abdulrahman.almutairi',
    archived: false,
    lowOnBudget: false
  },

  // --- Archived (5) ---
  {
    id: 'cl-051',
    applicationId: 'app-1',
    name: '[Archived] Launch Promo 2024',
    type: 'discount',
    status: 'expired',
    store: 'All Stores',
    startDate: '2024-06-01T00:00:00Z',
    endDate: '2024-06-30T23:59:59Z',
    couponRedemptions: 45000,
    totalDiscounts: 6750000,
    lastActivity: '2024-06-30T23:59:59Z',
    createdAt: '2024-05-15T08:00:00Z',
    createdBy: 'abdulrahman.almutairi',
    archived: true,
    lowOnBudget: false
  },
  {
    id: 'cl-052',
    applicationId: 'app-1',
    name: '[Archived] Beta Tester Rewards',
    type: 'loyalty',
    status: 'expired',
    store: 'Online',
    startDate: '2024-03-01T00:00:00Z',
    endDate: '2024-05-31T23:59:59Z',
    couponRedemptions: 1200,
    totalDiscounts: 0,
    lastActivity: '2024-05-31T23:59:59Z',
    createdAt: '2024-02-20T10:00:00Z',
    createdBy: 'khalid.ibrahim',
    archived: true,
    lowOnBudget: false
  },
  {
    id: 'cl-053',
    applicationId: 'app-1',
    name: '[Archived] Old Welcome Coupon',
    type: 'coupon',
    status: 'disabled',
    store: 'All Stores',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    couponRedemptions: 28000,
    totalDiscounts: 1400000,
    lastActivity: '2024-08-01T10:00:00Z',
    createdAt: '2023-12-15T09:00:00Z',
    createdBy: 'sara.alharbi',
    archived: true,
    lowOnBudget: false
  },
  {
    id: 'cl-054',
    applicationId: 'app-1',
    name: '[Archived] National Day 2024',
    type: 'discount',
    status: 'expired',
    store: 'All Stores',
    startDate: '2024-09-20T00:00:00Z',
    endDate: '2024-09-25T23:59:59Z',
    couponRedemptions: 12000,
    totalDiscounts: 1200000,
    lastActivity: '2024-09-25T23:59:59Z',
    createdAt: '2024-09-10T08:00:00Z',
    createdBy: 'omar.hassan',
    archived: true,
    lowOnBudget: false
  },
  {
    id: 'cl-055',
    applicationId: 'app-1',
    name: '[Archived] Black Friday 2024',
    type: 'discount',
    status: 'expired',
    store: 'All Stores',
    startDate: '2024-11-25T00:00:00Z',
    endDate: '2024-11-30T23:59:59Z',
    couponRedemptions: 19500,
    totalDiscounts: 3900000,
    lastActivity: '2024-11-30T23:59:59Z',
    createdAt: '2024-11-01T10:00:00Z',
    createdBy: 'ahmed.mansour',
    archived: true,
    lowOnBudget: false
  }
]
```

**Step 2: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/mocks/campaignList.ts
git commit -m "feat: add mock campaign list data (~55 entries)"
```

---

### Task 3: Create campaign list service

**Files:**
- Create: `src/lib/services/campaignListService.ts`

**Step 1: Create the service file**

```typescript
// src/lib/services/campaignListService.ts
import { mockCampaignList } from '$lib/mocks/campaignList'
import type { CampaignListItem } from '$lib/types'

// GET /v1/applications/:applicationId/campaigns/list
export async function getCampaignList(applicationId: string): Promise<CampaignListItem[]> {
  return mockCampaignList.filter((c) => c.applicationId === applicationId)
}

// POST /v1/campaigns/:campaignId/clone
export async function cloneCampaign(campaignId: string, newName: string): Promise<CampaignListItem> {
  const original = mockCampaignList.find((c) => c.id === campaignId)
  if (!original) throw new Error(`Campaign ${campaignId} not found`)

  const cloned: CampaignListItem = {
    ...original,
    id: `cl-clone-${Date.now()}`,
    name: newName,
    status: 'disabled',
    couponRedemptions: 0,
    totalDiscounts: 0,
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    archived: false,
    lowOnBudget: false
  }
  return cloned
}
```

**Step 2: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/services/campaignListService.ts
git commit -m "feat: add campaign list service with getCampaignList and cloneCampaign"
```

---

### Task 4: Create campaign list store

**Files:**
- Create: `src/lib/stores/campaignListStore.svelte.ts`

**Step 1: Create the store file**

```typescript
// src/lib/stores/campaignListStore.svelte.ts
import { getCampaignList, cloneCampaign } from '$lib/services/campaignListService'
import type { CampaignListItem, CampaignListFilterStatus } from '$lib/types'

type Tab = 'current' | 'calendar' | 'archived'

function createCampaignListStore() {
  let campaigns = $state<CampaignListItem[]>([])
  let activeTab = $state<Tab>('current')
  let searchQuery = $state('')
  let activeFilters = $state<Set<CampaignListFilterStatus>>(new Set())
  let page = $state(1)
  const pageSize = 50
  let loading = $state(false)

  // --- Derived chain: tab → search → status → paginate ---

  const tabFilteredCampaigns = $derived(
    activeTab === 'archived'
      ? campaigns.filter((c) => c.archived)
      : campaigns.filter((c) => !c.archived)
  )

  const searchFilteredCampaigns = $derived(() => {
    if (!searchQuery.trim()) return tabFilteredCampaigns
    const q = searchQuery.trim().toLowerCase()
    return tabFilteredCampaigns.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    )
  })

  const statusFilteredCampaigns = $derived(() => {
    const filtered = searchFilteredCampaigns()
    if (activeFilters.size === 0) return filtered
    return filtered.filter((c) => {
      for (const f of activeFilters) {
        if (f === 'lowOnBudget' && c.lowOnBudget) return true
        if (f === 'expiringSoon' && isExpiringSoon(c)) return true
        if (f === c.status) return true
      }
      return false
    })
  })

  const totalCount = $derived(statusFilteredCampaigns().length)

  const paginatedCampaigns = $derived(() => {
    const start = (page - 1) * pageSize
    return statusFilteredCampaigns().slice(start, start + pageSize)
  })

  // Filter counts are computed from tab-filtered data (not affected by active status filters)
  const filterCounts = $derived(() => {
    const base = searchFilteredCampaigns()
    const counts: Record<CampaignListFilterStatus, number> = {
      scheduled: 0,
      running: 0,
      expired: 0,
      disabled: 0,
      lowOnBudget: 0,
      expiringSoon: 0
    }
    for (const c of base) {
      if (c.status === 'scheduled') counts.scheduled++
      if (c.status === 'running') counts.running++
      if (c.status === 'expired') counts.expired++
      if (c.status === 'disabled') counts.disabled++
      if (c.lowOnBudget) counts.lowOnBudget++
      if (isExpiringSoon(c)) counts.expiringSoon++
    }
    return counts
  })

  const totalPages = $derived(Math.max(1, Math.ceil(totalCount / pageSize)))

  // --- Actions ---

  async function loadCampaigns(applicationId: string) {
    loading = true
    try {
      campaigns = await getCampaignList(applicationId)
    } finally {
      loading = false
    }
  }

  function setTab(tab: Tab) {
    activeTab = tab
    searchQuery = ''
    activeFilters = new Set()
    page = 1
  }

  function setSearchQuery(query: string) {
    searchQuery = query
    page = 1
  }

  function toggleFilter(status: CampaignListFilterStatus) {
    const next = new Set(activeFilters)
    if (next.has(status)) {
      next.delete(status)
    } else {
      next.add(status)
    }
    activeFilters = next
    page = 1
  }

  function clearFilters() {
    activeFilters = new Set()
    page = 1
  }

  function setPage(p: number) {
    page = p
  }

  async function clone(campaignId: string, newName: string) {
    const cloned = await cloneCampaign(campaignId, newName)
    campaigns = [cloned, ...campaigns]
  }

  return {
    get campaigns() { return paginatedCampaigns() },
    get activeTab() { return activeTab },
    get searchQuery() { return searchQuery },
    get activeFilters() { return activeFilters },
    get page() { return page },
    get pageSize() { return pageSize },
    get totalCount() { return totalCount },
    get totalPages() { return totalPages },
    get filterCounts() { return filterCounts() },
    get loading() { return loading },
    loadCampaigns,
    setTab,
    setSearchQuery,
    toggleFilter,
    clearFilters,
    setPage,
    clone
  }
}

// Helper: campaign expires within 7 days and is still running
function isExpiringSoon(c: CampaignListItem): boolean {
  if (c.status !== 'running') return false
  const endDate = new Date(c.endDate)
  const now = new Date()
  const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return daysUntilEnd >= 0 && daysUntilEnd <= 7
}

export const campaignListStore = createCampaignListStore()
```

**Step 2: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/stores/campaignListStore.svelte.ts
git commit -m "feat: add campaignListStore with tab/search/filter/pagination state"
```

---

### Task 5: Create Modal UI component

No Modal component exists in the project yet. Create a generic one for the clone dialog.

**Files:**
- Create: `src/lib/components/ui/Modal.svelte`

**Step 1: Create Modal.svelte**

```svelte
<!-- src/lib/components/ui/Modal.svelte -->
<script lang="ts">
  import { X } from 'lucide-svelte'
  import type { Snippet } from 'svelte'

  let {
    open = $bindable(false),
    title = '',
    children,
    class: className = ''
  }: {
    open?: boolean
    title?: string
    children: Snippet
    class?: string
  } = $props()

  function handleBackdropClick() {
    open = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center"
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-label={title}
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/40"
      onclick={handleBackdropClick}
      role="presentation"
    ></div>

    <!-- Panel -->
    <div class="relative w-full max-w-md rounded-xl border border-border bg-panel p-6 shadow-lg {className}">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-ink">{title}</h2>
        <button
          class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          onclick={() => open = false}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Body -->
      <div class="mt-4">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
```

**Step 2: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/components/ui/Modal.svelte
git commit -m "feat: add reusable Modal UI component"
```

---

### Task 6: Create campaign page components

Build all 7 components for the campaigns page. These are all new files — no existing code is modified.

**Files:**
- Create: `src/lib/components/campaigns/CampaignTabs.svelte`
- Create: `src/lib/components/campaigns/CampaignSearchBar.svelte`
- Create: `src/lib/components/campaigns/CampaignStatusFilters.svelte`
- Create: `src/lib/components/campaigns/CampaignTable.svelte`
- Create: `src/lib/components/campaigns/CampaignTableRow.svelte`
- Create: `src/lib/components/campaigns/CampaignPagination.svelte`
- Create: `src/lib/components/campaigns/CloneCampaignModal.svelte`

**Step 1: Create CampaignTabs.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignTabs.svelte -->
<script lang="ts">
  let {
    activeTab,
    onchange,
    class: className = ''
  }: {
    activeTab: 'current' | 'calendar' | 'archived'
    onchange: (tab: 'current' | 'calendar' | 'archived') => void
    class?: string
  } = $props()

  const tabs: Array<{ id: 'current' | 'calendar' | 'archived'; label: string }> = [
    { id: 'current', label: 'Current' },
    { id: 'calendar', label: 'Calendar View' },
    { id: 'archived', label: 'Archived' }
  ]
</script>

<div class="flex gap-0 border-b border-border {className}">
  {#each tabs as tab (tab.id)}
    <button
      class="relative px-4 py-2.5 text-sm font-medium transition-colors {
        activeTab === tab.id
          ? 'text-primary'
          : 'text-gray-500 hover:text-gray-700'
      }"
      onclick={() => onchange(tab.id)}
    >
      {tab.label}
      {#if activeTab === tab.id}
        <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
      {/if}
    </button>
  {/each}
</div>
```

**Step 2: Create CampaignSearchBar.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignSearchBar.svelte -->
<script lang="ts">
  import { Search } from 'lucide-svelte'

  let {
    value = $bindable(''),
    oninput,
    class: className = ''
  }: {
    value?: string
    oninput?: (query: string) => void
    class?: string
  } = $props()

  let debounceTimer: ReturnType<typeof setTimeout>

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement
    value = target.value
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      oninput?.(value)
    }, 300)
  }
</script>

<div class="relative {className}">
  <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
  <input
    type="text"
    placeholder="Campaign name, tags or id"
    {value}
    oninput={handleInput}
    class="w-full rounded-lg border border-border bg-panel py-2 pl-9 pr-3 text-sm text-ink placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
  />
</div>
```

**Step 3: Create CampaignStatusFilters.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignStatusFilters.svelte -->
<script lang="ts">
  import type { CampaignListFilterStatus } from '$lib/types'

  let {
    counts,
    activeFilters,
    ontoggle,
    onclear,
    class: className = ''
  }: {
    counts: Record<CampaignListFilterStatus, number>
    activeFilters: Set<CampaignListFilterStatus>
    ontoggle: (status: CampaignListFilterStatus) => void
    onclear: () => void
    class?: string
  } = $props()

  const filters: Array<{ status: CampaignListFilterStatus; label: string; color: string }> = [
    { status: 'scheduled', label: 'Scheduled', color: 'bg-green-500' },
    { status: 'running', label: 'Running', color: 'bg-green-500' },
    { status: 'expired', label: 'Expired', color: 'bg-danger' },
    { status: 'disabled', label: 'Disabled', color: 'bg-warning' },
    { status: 'lowOnBudget', label: 'Low on budget', color: 'bg-orange-400' },
    { status: 'expiringSoon', label: 'Expiring soon', color: 'bg-yellow-500' }
  ]

  const hasActive = $derived(activeFilters.size > 0)
</script>

<div class="flex flex-wrap items-center gap-2 {className}">
  {#each filters as filter (filter.status)}
    <button
      class="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors {
        activeFilters.has(filter.status)
          ? 'border-primary bg-blue-50 text-primary'
          : 'border-border bg-panel text-gray-600 hover:border-gray-300'
      }"
      onclick={() => ontoggle(filter.status)}
    >
      <span class="inline-block h-2 w-2 rounded-full {filter.color}"></span>
      {filter.label} ({counts[filter.status].toLocaleString()})
    </button>
  {/each}

  {#if hasActive}
    <button class="text-xs text-primary hover:underline" onclick={onclear}>
      Clear all
    </button>
  {/if}
</div>
```

**Step 4: Create CampaignTableRow.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignTableRow.svelte -->
<script lang="ts">
  import { Copy, FileText } from 'lucide-svelte'
  import type { CampaignListItem, CampaignType } from '$lib/types'
  import { formatDate, formatCurrency, formatNumber } from '$lib/utils'

  let {
    campaign,
    oncopy,
    ontemplate
  }: {
    campaign: CampaignListItem
    oncopy: (campaign: CampaignListItem) => void
    ontemplate: (campaign: CampaignListItem) => void
  } = $props()

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    running: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700',
    disabled: 'bg-gray-100 text-gray-600'
  }

  const typeIcons: Record<CampaignType, string> = {
    discount: '%',
    coupon: 'C',
    loyalty: 'L',
    giveaway: 'G'
  }
</script>

<tr class="border-b border-border hover:bg-gray-50/50">
  <td class="whitespace-nowrap px-3 py-3 text-sm font-medium text-ink">
    {campaign.name}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-center">
    <span class="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-semibold text-gray-600">
      {typeIcons[campaign.type]}
    </span>
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500 font-mono">
    {campaign.id}
  </td>
  <td class="whitespace-nowrap px-3 py-3">
    <span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide {statusColors[campaign.status]}">
      {campaign.status}
    </span>
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {campaign.store}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {formatDate(campaign.startDate)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {formatDate(campaign.endDate)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500 font-mono text-right">
    {formatNumber(campaign.couponRedemptions)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500 font-mono text-right">
    {formatCurrency(campaign.totalDiscounts)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {formatDate(campaign.lastActivity)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {formatDate(campaign.createdAt)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {campaign.createdBy}
  </td>
  <td class="whitespace-nowrap px-3 py-2 text-center">
    <button
      class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      title="Copy campaign"
      onclick={() => oncopy(campaign)}
    >
      <Copy size={15} />
    </button>
  </td>
  <td class="whitespace-nowrap px-3 py-2 text-center">
    <button
      class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      title="Save as template"
      onclick={() => ontemplate(campaign)}
    >
      <FileText size={15} />
    </button>
  </td>
</tr>
```

**Step 5: Create CampaignTable.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignTable.svelte -->
<script lang="ts">
  import type { CampaignListItem } from '$lib/types'
  import CampaignTableRow from './CampaignTableRow.svelte'

  let {
    campaigns,
    oncopy,
    ontemplate,
    class: className = ''
  }: {
    campaigns: CampaignListItem[]
    oncopy: (campaign: CampaignListItem) => void
    ontemplate: (campaign: CampaignListItem) => void
    class?: string
  } = $props()

  const columns = [
    'Campaign Name',
    'Type',
    'ID',
    'Status',
    'Store',
    'Start',
    'End',
    'Coupon Redemptions',
    'Total Discounts',
    'Last Activity',
    'Created',
    'Created By',
    'Copy',
    'Template'
  ]
</script>

<div class="overflow-x-auto rounded-lg border border-border {className}">
  <table class="w-full min-w-[1200px]">
    <thead>
      <tr class="border-b border-border bg-gray-50/80">
        {#each columns as col}
          <th class="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {col}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each campaigns as campaign (campaign.id)}
        <CampaignTableRow {campaign} {oncopy} {ontemplate} />
      {:else}
        <tr>
          <td colspan={columns.length} class="px-3 py-8 text-center text-sm text-gray-400">
            No campaigns found.
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
```

**Step 6: Create CampaignPagination.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignPagination.svelte -->
<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte'

  let {
    page,
    pageSize,
    totalCount,
    totalPages,
    onchange,
    class: className = ''
  }: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    onchange: (page: number) => void
    class?: string
  } = $props()

  const rangeStart = $derived((page - 1) * pageSize + 1)
  const rangeEnd = $derived(Math.min(page * pageSize, totalCount))
  const hasPrev = $derived(page > 1)
  const hasNext = $derived(page < totalPages)
</script>

<div class="flex items-center gap-2 text-sm text-gray-500 {className}">
  <span class="font-mono">
    {rangeStart}–{rangeEnd}
  </span>
  <span>of</span>
  <span class="font-mono">{totalCount.toLocaleString()}</span>

  <button
    class="ml-2 rounded-lg p-1 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
    disabled={!hasPrev}
    onclick={() => onchange(page - 1)}
  >
    <ChevronLeft size={16} />
  </button>
  <button
    class="rounded-lg p-1 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
    disabled={!hasNext}
    onclick={() => onchange(page + 1)}
  >
    <ChevronRight size={16} />
  </button>
</div>
```

**Step 7: Create CloneCampaignModal.svelte**

```svelte
<!-- src/lib/components/campaigns/CloneCampaignModal.svelte -->
<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import type { CampaignListItem } from '$lib/types'

  let {
    campaign,
    open = $bindable(false),
    onconfirm
  }: {
    campaign: CampaignListItem | null
    open?: boolean
    onconfirm: (campaignId: string, newName: string) => void
  } = $props()

  let cloneName = $state('')

  $effect(() => {
    if (campaign && open) {
      cloneName = `Copy of ${campaign.name}`
    }
  })

  function handleConfirm() {
    if (campaign && cloneName.trim()) {
      onconfirm(campaign.id, cloneName.trim())
      open = false
    }
  }
</script>

<Modal bind:open title="Copy Campaign">
  <div class="space-y-4">
    <div>
      <label for="clone-name" class="block text-sm font-medium text-gray-700">
        Campaign name
      </label>
      <input
        id="clone-name"
        type="text"
        bind:value={cloneName}
        class="mt-1 w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>

    <div class="flex justify-end gap-2">
      <Button variant="secondary" onclick={() => open = false}>Cancel</Button>
      <Button variant="primary" onclick={handleConfirm}>Confirm</Button>
    </div>
  </div>
</Modal>
```

**Step 8: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 9: Commit**

```bash
git add src/lib/components/campaigns/
git commit -m "feat: add campaign page components (tabs, search, filters, table, pagination, clone modal)"
```

---

### Task 7: Wire up the campaigns page

Replace the placeholder campaigns page with the full implementation.

**Files:**
- Modify: `src/routes/applications/[id]/campaigns/+page.svelte`

**Step 1: Replace the page content**

Replace the entire content of `src/routes/applications/[id]/campaigns/+page.svelte` with:

```svelte
<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { campaignListStore } from '$lib/stores/campaignListStore.svelte'
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte'
  import PageActions from '$lib/components/ui/PageActions.svelte'
  import CampaignTabs from '$lib/components/campaigns/CampaignTabs.svelte'
  import CampaignSearchBar from '$lib/components/campaigns/CampaignSearchBar.svelte'
  import CampaignStatusFilters from '$lib/components/campaigns/CampaignStatusFilters.svelte'
  import CampaignTable from '$lib/components/campaigns/CampaignTable.svelte'
  import CampaignPagination from '$lib/components/campaigns/CampaignPagination.svelte'
  import CloneCampaignModal from '$lib/components/campaigns/CloneCampaignModal.svelte'
  import type { CampaignListItem } from '$lib/types'

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: 'Campaigns' }
  ])

  let cloneTarget = $state<CampaignListItem | null>(null)
  let cloneModalOpen = $state(false)

  $effect(() => {
    if (appId) {
      campaignListStore.loadCampaigns(appId)
    }
  })

  function handleCopy(campaign: CampaignListItem) {
    cloneTarget = campaign
    cloneModalOpen = true
  }

  function handleTemplate(_campaign: CampaignListItem) {
    // Future feature — no-op for now
  }

  function handleCloneConfirm(campaignId: string, newName: string) {
    campaignListStore.clone(campaignId, newName)
  }
</script>

<div class="p-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <Breadcrumb items={breadcrumbItems} />
    <PageActions />
  </div>

  <!-- Tabs -->
  <CampaignTabs
    activeTab={campaignListStore.activeTab}
    onchange={(tab) => campaignListStore.setTab(tab)}
    class="mt-6"
  />

  <!-- Tab content -->
  {#if campaignListStore.activeTab === 'calendar'}
    <div class="mt-12 flex flex-col items-center justify-center text-center">
      <h2 class="text-lg font-semibold text-ink">Calendar View</h2>
      <p class="mt-2 text-sm text-gray-500">This view is coming soon.</p>
    </div>
  {:else}
    <!-- Search -->
    <CampaignSearchBar
      value={campaignListStore.searchQuery}
      oninput={(q) => campaignListStore.setSearchQuery(q)}
      class="mt-4 max-w-sm"
    />

    <!-- Filters + Pagination row -->
    <div class="mt-4 flex items-start justify-between">
      <CampaignStatusFilters
        counts={campaignListStore.filterCounts}
        activeFilters={campaignListStore.activeFilters}
        ontoggle={(s) => campaignListStore.toggleFilter(s)}
        onclear={() => campaignListStore.clearFilters()}
      />
      <CampaignPagination
        page={campaignListStore.page}
        pageSize={campaignListStore.pageSize}
        totalCount={campaignListStore.totalCount}
        totalPages={campaignListStore.totalPages}
        onchange={(p) => campaignListStore.setPage(p)}
      />
    </div>

    <!-- Table -->
    <CampaignTable
      campaigns={campaignListStore.campaigns}
      oncopy={handleCopy}
      ontemplate={handleTemplate}
      class="mt-4"
    />
  {/if}
</div>

<!-- Clone modal -->
<CloneCampaignModal
  campaign={cloneTarget}
  bind:open={cloneModalOpen}
  onconfirm={handleCloneConfirm}
/>
```

**Step 2: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/routes/applications/[id]/campaigns/+page.svelte
git commit -m "feat: implement full campaigns list page with tabs, search, filters, table, and clone"
```

---

### Task 8: Final verification

**Step 1: Type check**

Run: `bun run check`
Expected: No errors

**Step 2: Production build**

Run: `bun run build`
Expected: Build succeeds with no errors

**Step 3: Manual verification checklist**

Start dev server with `bun run dev` and verify:

1. Navigate to `/applications/app-1/campaigns`
2. **Breadcrumb** shows: Apps > KSA Production > Campaigns
3. **Tabs** show: Current (active), Calendar View, Archived
4. **Current tab**: Search bar visible, 6 filter pills with counts, pagination "1–50 of N"
5. **Table** renders with all columns, horizontal scroll works
6. **Search**: Type a campaign name → table filters with 300ms debounce
7. **Filter pills**: Click "Running" → only running campaigns shown, pill highlighted blue. Click "Expired" → running + expired shown (OR logic). Click "Clear all" → back to all.
8. **Pagination**: If >50 campaigns, click next arrow → shows next page, "51–N" range updates
9. **Clone**: Click Copy icon → modal opens with "Copy of [name]" pre-filled. Edit name, click Confirm → new campaign appears in list. Click Cancel → modal closes.
10. **Template**: Click Template icon → no-op (nothing crashes)
11. **Calendar View tab**: Shows "Calendar View coming soon" placeholder
12. **Archived tab**: Shows only archived campaigns (the 5 `[Archived]` entries)
13. **Sidebar**: "Campaigns" nav item in ApplicationContextPanel is highlighted

**Step 4: Fix any issues found and commit**

If issues are found during manual verification, fix and commit with descriptive messages.

---

## File Summary

### New files (11)
- `src/lib/types/campaign.ts` (modified — extended with new types)
- `src/lib/mocks/campaignList.ts`
- `src/lib/services/campaignListService.ts`
- `src/lib/stores/campaignListStore.svelte.ts`
- `src/lib/components/ui/Modal.svelte`
- `src/lib/components/campaigns/CampaignTabs.svelte`
- `src/lib/components/campaigns/CampaignSearchBar.svelte`
- `src/lib/components/campaigns/CampaignStatusFilters.svelte`
- `src/lib/components/campaigns/CampaignTable.svelte`
- `src/lib/components/campaigns/CampaignTableRow.svelte`
- `src/lib/components/campaigns/CampaignPagination.svelte`
- `src/lib/components/campaigns/CloneCampaignModal.svelte`

### Modified files (1)
- `src/routes/applications/[id]/campaigns/+page.svelte` (replaced placeholder)

### Unchanged files
- All existing components, stores, services, mocks, utils
- All other route pages
