# PromoForge Dashboard — Design Document

> Approved: 2026-02-21
> Source spec: `docs/desgin/PROMOFORGE_DASHBOARD_SPEC.md`

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Charting library | LayerChart | Svelte-native, built on D3, best Svelte integration |
| Body font | Geist (variable) | Geometric sans-serif, clean for data-dense UIs |
| Mono font | JetBrains Mono (variable) | Precise feel for KPI numbers and stats |
| Icon library | lucide-svelte | Official Svelte package, tree-shakeable, matches spec |
| Layout approach | Replace existing AppShell | Dashboard IS the app for now; three-zone spec layout |
| Data layer | Full three-layer (services + mocks + stores) | Swap-ready for real API, spec-prescribed architecture |
| Build approach | Bottom-up | Types → mocks → services → stores → UI → layout → zones → page |

## New Dependencies

- `@fontsource-variable/geist-sans`
- `@fontsource-variable/jetbrains-mono`
- `lucide-svelte`
- `layerchart`

---

## 1. Foundation — Theme & Typography

### Fonts

- **Geist** (body/headings) via `@fontsource-variable/geist-sans`
- **JetBrains Mono** (numbers/stats) via `@fontsource-variable/jetbrains-mono`
- Imported in `app.css`, registered as Tailwind v4 theme values via `@theme`

### Color Tokens (Tailwind v4 `@theme`)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface` | `#FAFAF9` | Dashboard area background |
| `--color-panel` | `#FFFFFF` | Side nav, cards, panels |
| `--color-border` | `#E8E8E6` | Panel borders |
| `--color-primary` | `#2563EB` | CTAs, active nav, LIVE badge |
| `--color-sandbox` | `#6366F1` | Sandbox badge |
| `--color-success` | `#16A34A` | Running/live status |
| `--color-warning` | `#CA8A04` | Disabled status |
| `--color-danger` | `#DC2626` | Expired status |
| `--color-coral` | `#F87171` | Revenue chart, donut ring |
| `--color-ink` | `#18181B` | Primary text, KPI numbers |

### Shadows

- `shadow-card`: `0 1px 2px rgba(0,0,0,0.05)` — used on all cards

### Spacing

Standard Tailwind: `3` (12px), `4` (16px), `6` (24px). No custom values needed.

---

## 2. Type Definitions

All in `src/lib/types/`, one file per domain, re-exported from `index.ts`.

### `application.ts`

```typescript
export type Environment = 'live' | 'sandbox'

export interface Application {
  id: string
  name: string
  environment: Environment
  campaignCount: number
  runningCount: number
  disabledCount: number
  expiredCount: number
}
```

### `campaign.ts`

```typescript
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
```

### `dashboard.ts`

```typescript
export type TimeRange = 'custom' | 'yesterday' | '7d' | '30d' | '3m' | '6m' | 'ytd' | 'max'

export interface KpiData {
  running: number
  expiringSoon: number
  lowOnBudget: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
}

export interface RevenueSummaryRow {
  label: string
  yesterday: number
  past7Days: number
  pastMonth: number
  currentMonth: number
  past3Months: number
}

export interface PastWeekSummary {
  influenceRate: number
  totalRevenue: number
  influencedRevenue: number
  revenueChange: number
  influencedChange: number
}

export interface DashboardData {
  kpi: KpiData
  revenueChart: RevenueDataPoint[]
  pastWeekSummary: PastWeekSummary
  revenueSummary: RevenueSummaryRow[]
}
```

---

## 3. Service Layer & Mock Data

### File Structure

```
src/lib/
├── mocks/
│   ├── applications.ts
│   ├── campaigns.ts
│   └── dashboard.ts
├── services/
│   ├── applicationService.ts
│   ├── campaignService.ts
│   └── dashboardService.ts
```

### Service Pattern

Every service method:
- Is `async` (returns `Promise<T>`)
- Accepts all parameters the real API will need (even if mocks ignore them)
- Has a comment indicating the real API endpoint
- Imports from `$lib/mocks/`, never exposes mock internals

Example:
```typescript
import { mockApplications } from '$lib/mocks/applications'
import type { Application } from '$lib/types'

// GET /v1/applications
export async function getApplications(): Promise<Application[]> {
  return mockApplications
}
```

### Services

- **applicationService**: `getApplications()`, `getApplication(id: string)`
- **campaignService**: `getRecentCampaigns(limit: number)`, `getCampaignsByApplication(applicationId: string)`
- **dashboardService**: `getDashboardData(applicationId: string, timeRange: TimeRange)`

### Mock Data

Saudi-market realistic: SAR currency, Arabic user names, KSA/UAE application names. 3-4 applications, 6-8 recent campaigns, 90 days of revenue data points.

---

## 4. Stores (State Management)

Svelte 5 rune-based stores in `.svelte.ts` files. Stores call services, never mocks.

### `applicationStore.svelte.ts`

State:
- `applications: Application[]`
- `selectedId: string | null`
- `searchQuery: string`

Derived:
- `selectedApplication` — from `applications` + `selectedId`
- `filteredApplications` — from `applications` + `searchQuery`

Actions:
- `loadApplications()` — calls `applicationService.getApplications()`
- `selectApplication(id)` — sets `selectedId`
- `setSearchQuery(query)` — sets `searchQuery`

### `dashboardStore.svelte.ts`

State:
- `dashboardData: DashboardData | null`
- `timeRange: TimeRange` (default: `'30d'`)
- `loading: boolean`

Actions:
- `loadDashboard(applicationId, range)` — calls `dashboardService.getDashboardData()`
- `setTimeRange(range)` — sets `timeRange`, triggers reload

Both stores export a factory function returning the reactive state object.

---

## 5. UI Primitives

All in `src/lib/components/ui/`. Each uses `$props()`, accepts a `class` prop.

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Badge.svelte` | Environment/status pills | `variant: 'live' \| 'sandbox'`, `label` |
| `Button.svelte` | Primary/secondary actions | `variant`, `size`, `onclick` |
| `Card.svelte` | White container with shadow-card | `class` pass-through |
| `Input.svelte` | Search/text fields | `placeholder`, `value`, `oninput` |
| `StatusDot.svelte` | Colored dot + count + label | `color`, `count`, `label` |
| `Tooltip.svelte` | Hover info tooltip | `text`, slot for trigger |
| `SegmentedControl.svelte` | Time range selector | `options`, `selected`, `onchange` |
| `StatCard.svelte` | KPI card (label + mono number) | `label`, `value`, `tooltip` |

---

## 6. Layout & Zone Components

Replaces existing `AppShell`, `Sidebar`, `Header`.

### File Structure

```
src/lib/components/layout/
├── DashboardLayout.svelte    # Three-zone grid (replaces AppShell)
├── IconRail.svelte           # Zone A — 56px icon nav
├── ApplicationPanel.svelte   # Zone B — 380px app list panel
└── (Header.svelte — removed)

src/lib/components/dashboard/
├── ApplicationCard.svelte    # Card in Zone B app list
├── CampaignCard.svelte       # Card in Zone B recent campaigns
├── RevenueChart.svelte       # LayerChart line chart wrapper
├── DonutChart.svelte         # LayerChart donut/arc wrapper
└── RevenueSummaryTable.svelte # Revenue data table
```

### DashboardLayout.svelte

CSS Grid: `grid-cols-[56px_380px_1fr]`, `h-screen`. Three children side by side, full viewport.

### IconRail.svelte (Zone A)

- 56px wide, `bg-panel`, `border-r border-border`
- Logo mark at top (PromoForge icon SVG or text placeholder)
- Nav items: Apps, Loyalty, Giveaways, Templates, Audiences — icon + 10-11px label
- Bottom-pinned: Account (gear), Profile (user) — via `mt-auto`
- Active: `text-primary`, inactive: `text-gray-500`, hover: `text-gray-700`

### ApplicationPanel.svelte (Zone B)

- 380px wide, `bg-panel`, `border-r border-border`, `overflow-y-auto`
- Top row: `Input` (search) + `Button` (+ Create Application)
- `ApplicationCard` list — selected card: `border-l-2 border-primary bg-blue-50/50`
- "Recently Updated Campaigns" section heading + `CampaignCard` list

### Zone C (in `+page.svelte`)

- `bg-surface`, `overflow-y-auto`
- Title: "My Account Dashboard"
- Dismissible info banner (local `$state`)
- Application dropdown selector
- KPI row: 3 `StatCard` components
- `SegmentedControl` for time range
- Side-by-side: `RevenueChart` (fluid) + Past 7 Days card (200px) with `DonutChart`
- `RevenueSummaryTable` below chart

### Component Tree

```
+layout.svelte
  └── DashboardLayout
        ├── IconRail
        ├── ApplicationPanel
        │     ├── ApplicationCard (×N)
        │     └── CampaignCard (×N)
        └── <slot /> → +page.svelte
              ├── StatCard (×3)
              ├── SegmentedControl
              ├── RevenueChart
              ├── DonutChart
              └── RevenueSummaryTable
```

---

## 7. Charts & Data Visualization

### Revenue Line Chart

- LayerChart `<LineChart>` component
- Coral stroke (`#F87171`) with gradient fill to transparent
- Y-axis: revenue ticks (0, 300K, 600K, etc.)
- X-axis: dates from time range
- Responsive, progressive draw animation

### Past 7 Days Donut Chart

- LayerChart arc/ring chart
- Coral fill on light gray track
- Percentage centered large + bold
- Inside 200px-wide summary card

### Revenue Summary Table

- Custom `<table>` component (no library)
- Horizontal rules only, no vertical borders
- Uppercase small gray headers
- Colored square indicators: blue (Total Revenue), coral (Influenced Revenue)
- Monospaced font for numbers
- SAR currency, abbreviated large numbers (14.45M)

---

## 8. Interaction States

### Application Selection
Click `ApplicationCard` → `applicationStore.selectApplication(id)` → Zone C reactively refreshes. Selected card: `border-l-2 border-primary bg-blue-50/50`.

### Time Range Switching
Click `SegmentedControl` segment → `dashboardStore.setTimeRange(range)` → chart + table update. Active segment: filled blue background.

### Search Filtering
Type in search → `applicationStore.setSearchQuery(query)` → `filteredApplications` updates → card list re-renders. Client-side, instant.

### Info Tooltips
`Tooltip` wraps info icons on KPI cards and table rows. CSS-based positioning, hover with short delay.

### Dismiss Banner
Local `$state(true)`. Click × sets to `false`. No persistence.

### Hover States
- App cards: `hover:shadow-md` + border change
- Nav items: `hover:text-gray-700` transition
- Table rows: `hover:bg-gray-50`

### Animations
- Dashboard content: 150ms ease opacity fade on app switch
- KPI numbers: count-up animation on load
- Chart line: progressive draw via LayerChart transitions
