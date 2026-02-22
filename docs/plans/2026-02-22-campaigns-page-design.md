# Campaigns Page Design

## Overview

Full-featured campaigns list page at `/applications/[id]/campaigns` with three tabs, search, status filters, a paginated data table, and clone/template actions. Follows Approach B: component-decomposed with a dedicated store.

## Data Model

### Extended Campaign Type

```typescript
type CampaignStatus = 'scheduled' | 'running' | 'expired' | 'disabled'
type CampaignType = 'discount' | 'coupon' | 'loyalty' | 'giveaway'

interface CampaignListItem {
  id: string
  applicationId: string
  name: string
  type: CampaignType
  status: CampaignStatus
  store: string
  startDate: string        // ISO date
  endDate: string          // ISO date
  couponRedemptions: number
  totalDiscounts: number   // currency value
  lastActivity: string     // ISO date
  createdAt: string        // ISO date
  createdBy: string
  archived: boolean
}
```

### Filter Status

```typescript
type CampaignListFilterStatus = 'scheduled' | 'running' | 'expired' | 'disabled' | 'lowOnBudget' | 'expiringSoon'
```

### Pagination

```typescript
interface PaginationState {
  page: number
  pageSize: number  // 50
  total: number
}
```

## Store Architecture

**`campaignListStore.svelte.ts`**

State:
- `campaigns: CampaignListItem[]`
- `activeTab: 'current' | 'calendar' | 'archived'`
- `searchQuery: string`
- `activeFilters: Set<CampaignListFilterStatus>`
- `page: number` (1-based)
- `pageSize: number` (50)
- `loading: boolean`

Derived state (chained: tab -> search -> status -> paginate):
- `tabFilteredCampaigns` — filter by archived flag based on active tab
- `searchFilteredCampaigns` — substring match on name or ID
- `statusFilteredCampaigns` — match ANY active filter (OR logic)
- `totalCount` — count after all filters
- `paginatedCampaigns` — final page slice
- `filterCounts` — per-status counts from tab-filtered set

Actions:
- `loadCampaigns(applicationId)` — fetch from service
- `setTab(tab)` — switch tab, reset page/search/filters
- `setSearchQuery(query)` — update search, reset page
- `toggleFilter(status)` — toggle filter pill, reset page
- `clearFilters()` — clear all filters
- `setPage(page)` — change page
- `cloneCampaign(id, newName)` — duplicate campaign

## Component Breakdown

### Page Layout

```
Breadcrumb + PageActions
├── CampaignTabs              (Current | Calendar View | Archived)
├── [if Current or Archived tab:]
│   ├── CampaignSearchBar     (search input)
│   ├── Row: CampaignStatusFilters (left) + CampaignPagination (right)
│   └── CampaignTable
│       └── CampaignTableRow × N
├── [if Calendar View tab:]
│   └── "Calendar View coming soon" placeholder
└── CloneCampaignModal        (shown on Copy click)
```

### New Components (`src/lib/components/campaigns/`)

| Component | Responsibility |
|-----------|---------------|
| CampaignTabs | 3-tab navigation with underline active state |
| CampaignSearchBar | Search input, placeholder "Campaign name, tags or id" |
| CampaignStatusFilters | Colored status pills with counts, clear all link |
| CampaignTable | Table header + scrollable body, overflow-x-auto |
| CampaignTableRow | All columns + Copy/Template action icons |
| CampaignPagination | "1 – 50 of N" text + prev/next arrows |
| CloneCampaignModal | Name input pre-filled "Copy of [name]", Confirm/Cancel |

### Reused Components

- Breadcrumb, PageActions, Badge, Input, Button (existing UI primitives)

## Mock Data

~50 CampaignListItem entries in `src/lib/mocks/campaignList.ts`:
- ~5 scheduled, ~15 running, ~20 expired, ~10 disabled
- Mix of types (discount, coupon, loyalty, giveaway)
- Realistic store names, dates spanning past year, user names
- A few marked as archived
- Some flagged as low on budget / expiring soon

## Service Layer

`src/lib/services/campaignListService.ts`:
- `getCampaignList(applicationId): Promise<CampaignListItem[]>`
- `cloneCampaign(campaignId, newName): Promise<CampaignListItem>`

## Interaction Behaviors

**Tabs:** Switching resets search/filters/page. Current = non-archived, Archived = archived, Calendar = placeholder.

**Search:** Debounced 300ms, matches name or ID (case-insensitive substring), resets page.

**Filters:** Toggle individually, OR logic (any active filter matches), counts from tab-filtered set, "Clear all" when any active.

**Pagination:** 50/page, "1 – 50 of N" format, prev/next arrows disabled at boundaries, resets on filter/search/tab change.

**Clone:** Copy icon -> modal with pre-filled name "Copy of [name]" -> Confirm duplicates campaign -> Cancel closes modal.

**Template:** No-op for now. Toast "Save as template coming soon."

**Table scroll:** overflow-x-auto container. Campaign Name column optionally sticky-left.
