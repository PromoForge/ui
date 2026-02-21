# Application Dashboard Views — Design Document

**Date:** 2026-02-22
**Status:** Approved

## Overview

Redesign the `/applications/[id]` section to implement a three-zone layout with an Application Context Panel (Zone B) and two switchable dashboard views:

- **View 1 — Revenue Overview:** High-level revenue dashboard with line chart, KPI highlights, past 7 days donut summary, and revenue summary table. Default landing view when clicking an application.
- **View 2 — Metrics Dashboard:** Six-card grid showing Revenue, Sessions, Discounts, Avg. Session Value, Avg. Items per Session, and Coupons with total vs. influenced breakdowns. Accessed via "Dashboard" nav item in Zone B.

## Architecture Decision

**Approach: SvelteKit Nested Layout**

- `/applications/[id]/+layout.svelte` provides Zone A (IconRail) + Zone B (ApplicationContextPanel) + Zone C (child route slot)
- Each view is a separate route (URL-addressable, browser back/forward works)
- Adding future views = adding a route folder

## Navigation Flow

1. User starts at application list (`/`) — existing page, unchanged
2. Clicks an application card → navigates to `/applications/[id]` (View 1: Revenue Overview)
3. Zone B appears with application context and nav items
4. Clicking "Dashboard" in Zone B → `/applications/[id]/dashboard` (View 2: Metrics Dashboard)
5. Breadcrumb provides navigation back: click app name → View 1, click "Apps" → app list
6. No Zone B nav item is highlighted when on View 1 (it's the default landing)

## Route Structure

```
src/routes/
├── +layout.svelte              # Root layout (unchanged)
├── +page.svelte                # App list page (/) — unchanged
├── applications/
│   └── [id]/
│       ├── +layout.svelte      # Three-zone shell: IconRail + ApplicationContextPanel + <slot>
│       ├── +layout.ts          # Load application data by ID
│       ├── +page.svelte        # View 1: Revenue Overview
│       ├── dashboard/
│       │   └── +page.svelte    # View 2: Metrics Dashboard
│       ├── campaigns/
│       │   └── +page.svelte    # Placeholder
│       ├── campaign-evaluation/
│       │   └── +page.svelte    # Placeholder
│       ├── notifications/
│       │   └── +page.svelte    # Placeholder
│       ├── stores/
│       │   └── +page.svelte    # Placeholder
│       ├── cart-item-filters/
│       │   └── +page.svelte    # Placeholder
│       ├── customers/
│       │   └── +page.svelte    # Placeholder
│       ├── sessions/
│       │   └── +page.svelte    # Placeholder
│       ├── events/
│       │   └── +page.svelte    # Placeholder
│       ├── coupon-finder/
│       │   └── +page.svelte    # Placeholder
│       └── settings-app/
│           └── +page.svelte    # Placeholder
└── settings/
    └── +page.svelte            # Global settings (unchanged)
```

## Zone B — ApplicationContextPanel

**Component:** `src/lib/components/layout/ApplicationContextPanel.svelte`

**Props:**
- `applicationId: string`
- `applicationName: string`
- `environment: 'live' | 'sandbox'`
- `currentPath: string` — from `$page.url.pathname`, for active nav highlighting

**Structure:**
1. Application Selector — "SELECT APPLICATION" label + dropdown with app name + environment badge + chevron
2. Create Campaign CTA — full-width blue button: "+ Create Campaign"
3. MANAGE APPLICATION section — Dashboard, Campaigns, Campaign Evaluation, Notifications, Stores, Cart Item Filters
4. ACTIVITY AND SUPPORT section — Customers, Sessions, Events, Coupon Finder, Settings

**Active state:** Matches `currentPath` against item href. Active: `text-primary bg-blue-50` + 2px left border. Inactive: `text-gray-600`.

**Width:** Fixed 220px, white background, right border.

**Icons (Lucide):** LayoutDashboard, Megaphone, BarChart3, Bell, Store, Filter, Users, Activity, Zap, Search, Settings.

## Zone C — View 1: Revenue Overview

**Route:** `/applications/[id]/+page.svelte`

**Components (top to bottom):**
1. `Breadcrumb` — Apps > [App Name] > Overview
2. `PageActions` — Documentation link + Manage Campaign Data dropdown
3. `InfoBanner` — Dismissible, "Dashboard updated daily at 11:59pm UTC..."
4. Application Selector (secondary) — dropdown for quick app switching
5. KPI Row — three `StatCard` components: Running (182), Expiring soon (14), Low on budget (4)
6. `SegmentedControl` — time range selector (Custom through Max)
7. Two-column layout: `RevenueChart` (left) + `PastWeekCard` (right, 220px)
8. `RevenueSummaryTable` — 3 rows × 5 time columns

**Data:** `dashboardStore.loadDashboard(applicationId)` on mount, `setTimeRange()` on change.

## Zone C — View 2: Metrics Dashboard

**Route:** `/applications/[id]/dashboard/+page.svelte`

**Components (top to bottom):**
1. `Breadcrumb` — Apps > [App Name] > Dashboard
2. `PageActions` — same as View 1
3. `InfoBanner` — same dismissible banner
4. Campaign Filters:
   - `CampaignDropdown` — "All campaigns" default, filters all cards
   - `CampaignFilterBar` — six status pills with colored dots and counts
5. `SegmentedControl` — time range selector
6. Metric Cards Grid (3×2):

| Card | Primary Label | Influenced? | Annotation |
|------|--------------|-------------|------------|
| Revenue | TOTAL (SAR) | Yes | Influence Rate |
| Sessions | TOTAL | Yes | Influence Rate |
| Discounts | GIVEN (SAR) | No | — |
| Avg. Session Value | TOTAL (SAR) | Yes | Uplift |
| Avg. Items per Session | TOTAL | Yes | Uplift |
| Coupons | REDEEMED | No | — |

**Data:** `appDetailStore.loadAppDetail(applicationId)` on mount. Campaign/status filters update store state.

## New Components

| Component | Purpose |
|-----------|---------|
| `ApplicationContextPanel.svelte` | Zone B — app context + navigation |
| `Breadcrumb.svelte` | Clickable breadcrumb trail |
| `InfoBanner.svelte` | Dismissible info banner |
| `PageActions.svelte` | Top-right documentation/actions bar |
| `CampaignDropdown.svelte` | Campaign filter dropdown |

## Service Changes

### `applicationService.ts`
- Add `getApplicationNavItems(applicationId)` — returns nav item config for Zone B

### `dashboardService.ts`
- Add `getRevenueOverview(applicationId, timeRange)` — wraps/replaces `getDashboardData`
- Add `getMetricCards(applicationId, timeRange, campaignFilter?)` — wraps/replaces `getAppDetailData`

### `campaignService.ts`
- Add `getCampaignStatusCounts(applicationId)` — returns filter pill data
- Add `getCampaigns(applicationId, status?, search?)` — for campaign dropdown

### Store changes
- `appDetailStore.svelte.ts` — add `selectedCampaignId` state for campaign dropdown

## YAGNI — Not Building

- Expandable Settings sub-menu
- Real campaign dropdown filtering (mock ignores filter param)
- Chart drill-down modals
- Animated number counting
- Toast/notification system
- Responsive/mobile layout

## Design Direction

- **Fonts:** Geist Variable (sans) + JetBrains Mono Variable (mono) — already configured
- **Colors:** Custom Tailwind theme already in `app.css` — surface, panel, border, primary, coral, ink
- **Shadows:** `shadow-card: 0 1px 2px rgba(0,0,0,0.05)` — already configured
- **Icons:** Lucide Svelte — already installed
- **Charts:** LayerChart — already integrated with animations
