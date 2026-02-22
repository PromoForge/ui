# Campaign Detail Page — Design Document

## Goal

Build the campaign detail view that appears when a user clicks into a specific campaign from the campaigns list. The sidebar swaps from application-level nav to campaign-level nav (Dashboard, Rule Builder, Coupons, Insights, Settings). The Dashboard sub-page is fully implemented; other sub-pages are placeholders.

## Scope

- Campaign-level nested layout with sidebar nav swap
- Full campaign Dashboard page (Details, State, Schedule, Rules, Performance cards + activation banner)
- Placeholder pages for Rule Builder, Coupons, Insights, Settings
- Campaign name in list table becomes a clickable link
- All action buttons/links on the dashboard are visual-only (no-ops)

## Architecture: Nested SvelteKit Layout

### Route structure

```
src/routes/applications/[id]/campaigns/[campaignId]/
├── +layout.svelte          # Campaign-level 3-column grid with CampaignContextPanel
├── +layout.ts              # Extracts campaignId param
├── +page.svelte            # Redirects to /dashboard
├── dashboard/+page.svelte  # Campaign Dashboard (full implementation)
├── rule-builder/+page.svelte   # Placeholder
├── coupons/+page.svelte        # Placeholder
├── insights/+page.svelte       # Placeholder
└── settings/+page.svelte       # Placeholder
```

The `[campaignId]/+layout.svelte` renders the same 3-column grid (`56px | 220px | 1fr`) as the application layout but swaps `ApplicationContextPanel` for `CampaignContextPanel`. The parent application layout still loads so `applicationStore` remains populated for breadcrumbs.

### How the layout nesting works

SvelteKit nests layouts. The `applications/[id]/+layout.svelte` currently renders `IconRail | ApplicationContextPanel | {children}`. When navigating to `/applications/[id]/campaigns/[campaignId]/dashboard`, the campaign-level layout takes over — it renders its own 3-column grid, effectively replacing the parent grid's content area with a full-screen campaign layout. This means the campaign layout must re-render the `IconRail` column itself (same as parent pattern).

## CampaignContextPanel (Sidebar)

Located at `src/lib/components/layout/CampaignContextPanel.svelte`.

Contents (top to bottom):

1. **Back link** — "< To Application" navigates to `/applications/[id]/campaigns`
2. **App selector** — Same "SELECT APPLICATION" dropdown (reuses `applicationStore` data and existing dropdown pattern)
3. **Create Campaign button** — Same blue "+ Create Campaign" CTA
4. **"MANAGE CAMPAIGN" section** with nav items:
   - Dashboard (LayoutDashboard icon)
   - Rule Builder (GitBranch icon)
   - Coupons (Ticket icon)
   - Insights (BarChart3 icon)
   - Settings (Settings icon, with chevron)

Active state: blue left border + blue-50 background, matching `ApplicationContextPanel` styling.

## Campaign Dashboard Page

### Layout

Full-width breadcrumb header, then content below:

1. **Dismissible activation banner** (full width) — "Consider the following steps before activating your campaign" with two side-by-side action cards: "Set a Schedule" and "Create Coupons". Each card has an X to dismiss individually. Entire banner has an X to dismiss all. Dismiss state is local (component-level `$state`, not persisted).

2. **Two-column content grid:**

| Left column | Right column |
|---|---|
| **Details card** — description, category, product list, "Go to Details" link. Tags section: "No tags yet" message with autofill hint. Last updated timestamp. | **State card** — status badge with colored dot, description text, "Disable Campaign" button (no-op) + kebab menu (no-op) |
| | **Schedule card** — schedule info or "No time limit" text, "Go to Schedule" link |
| **Rules card** — list of rules (name + "Defined by N conditions and N effect"), "Go to the Rule Builder" link | **Performance and Budgets card** — "Campaign Budgets" header, budget progress bars (label, type badge, current/limit), links to insights/coupons, "Go to Budgets" link |

## Data Layer

### New types (`src/lib/types/campaign.ts`)

```typescript
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
```

### Mock data (`src/lib/mocks/campaignDetail.ts`)

~5 detailed campaign entries matching some existing `CampaignListItem` IDs (e.g., cl-006, cl-008, cl-009, cl-017, cl-021). Each has realistic rules, budgets, and descriptions.

### Service (`src/lib/services/campaignDetailService.ts`)

```typescript
getCampaignDetail(campaignId: string): Promise<CampaignDetail>
```

Returns mock data by ID.

### Store (`src/lib/stores/campaignDetailStore.svelte.ts`)

```typescript
campaignDetailStore = {
  campaign: CampaignDetail | null   // current campaign
  loading: boolean
  hasSchedule: boolean              // derived
  isRunning: boolean                // derived
  loadCampaign(campaignId): void
}
```

## Components

### New components

| Component | Location | Purpose |
|---|---|---|
| `CampaignContextPanel` | `src/lib/components/layout/` | Campaign-level sidebar |
| `CampaignActivationBanner` | `src/lib/components/campaigns/` | Dismissible banner with action cards |
| `CampaignDetailsCard` | `src/lib/components/campaigns/` | Details + Tags |
| `CampaignStateCard` | `src/lib/components/campaigns/` | Status + Disable button |
| `CampaignScheduleCard` | `src/lib/components/campaigns/` | Schedule info |
| `CampaignRulesCard` | `src/lib/components/campaigns/` | Rules list |
| `CampaignBudgetsCard` | `src/lib/components/campaigns/` | Budget bars |

### Modified files

| File | Change |
|---|---|
| `CampaignTableRow.svelte` | Campaign name becomes a clickable `<a>` link to `/applications/[appId]/campaigns/[campaignId]/dashboard` |

### Reused components

`Breadcrumb`, `Badge`, `Card`, `Button`, `PageActions`

## File summary

### New files (17)
- `src/routes/applications/[id]/campaigns/[campaignId]/+layout.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/+layout.ts`
- `src/routes/applications/[id]/campaigns/[campaignId]/+page.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/dashboard/+page.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/rule-builder/+page.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/coupons/+page.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/insights/+page.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/settings/+page.svelte`
- `src/lib/components/layout/CampaignContextPanel.svelte`
- `src/lib/components/campaigns/CampaignActivationBanner.svelte`
- `src/lib/components/campaigns/CampaignDetailsCard.svelte`
- `src/lib/components/campaigns/CampaignStateCard.svelte`
- `src/lib/components/campaigns/CampaignScheduleCard.svelte`
- `src/lib/components/campaigns/CampaignRulesCard.svelte`
- `src/lib/components/campaigns/CampaignBudgetsCard.svelte`
- `src/lib/mocks/campaignDetail.ts`
- `src/lib/services/campaignDetailService.ts`
- `src/lib/stores/campaignDetailStore.svelte.ts`

### Modified files (2)
- `src/lib/types/campaign.ts` (add CampaignDetail, CampaignRule, CampaignBudget)
- `src/lib/components/campaigns/CampaignTableRow.svelte` (name → link)
