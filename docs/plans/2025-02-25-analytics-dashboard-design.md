# Analytics Dashboard — Design

## Goal

Build a fresh analytics dashboard on the main page that shows account-level analytics for the selected application. Uses shadcn-svelte components throughout, with layerchart for visualizations.

## Layout (top to bottom)

1. **Header** — "My Account Dashboard" + collapsible info banner
2. **Application selector** — shadcn Select with environment badges (LIVE/SB)
3. **KPI row** — 3 Cards: Running, Expiring Soon, Low on Budget
4. **Time range selector** — ToggleGroup, right-aligned
5. **Charts row** — Revenue area chart (layerchart) + Influence donut card
6. **Revenue summary table** — shadcn Table, multi-period comparison

## New Components

All in `src/lib/components/dashboard/`:

| Component | Description |
|-----------|-------------|
| `KpiCard.svelte` | shadcn Card with large number, label, info tooltip |
| `RevenueChart.svelte` | Layerchart area/line chart, clean axis styling |
| `InfluenceDonut.svelte` | Donut chart + total/influenced revenue metrics |
| `RevenueSummaryTable.svelte` | shadcn Table with formatted currency/percentage |
| `TimeRangeSelector.svelte` | shadcn ToggleGroup wrapper |
| `AppSelector.svelte` | shadcn Select with Badge integration |

## Data Flow

- Reuse `dashboardStore` and `applicationStore`
- Dashboard loads when selected application changes
- Time range changes trigger data reload
- Mock data stays as-is

## Deletions

- Old dashboard components (RevenueChart, PastWeekCard, RevenueSummaryTable)
- Old StatCard component
- Simplify `applications/[id]/+page.svelte` (no longer the analytics home)

## Tech

- shadcn-svelte (Cards, Table, Select, ToggleGroup, Badge, Tooltip, Alert)
- layerchart for charts
- Svelte 5 runes for state
- Tailwind CSS v4 for styling
