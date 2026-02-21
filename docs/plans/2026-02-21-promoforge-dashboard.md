# PromoForge Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the PromoForge admin dashboard — a three-zone, data-dense SaaS control panel with mock data, ready for real API integration.

**Architecture:** Three-layer data flow (Components → Stores → Services → Mocks). Three-zone CSS Grid layout (56px icon rail, 380px app panel, fluid dashboard). Svelte 5 runes for all state management. LayerChart for data visualization.

**Tech Stack:** SvelteKit 2, Svelte 5, Tailwind CSS v4, TypeScript, LayerChart, lucide-svelte, Geist font, JetBrains Mono font

**Design doc:** `docs/plans/2026-02-21-promoforge-dashboard-design.md`

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install all new dependencies**

Run:
```bash
npm install @fontsource-variable/geist-sans @fontsource-variable/jetbrains-mono lucide-svelte layerchart
```

**Step 2: Verify installation**

Run: `npm run check`
Expected: No errors. All packages resolve.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add dashboard dependencies (fonts, icons, charts)"
```

---

## Task 2: Configure Theme — Fonts, Colors, Shadows

**Files:**
- Modify: `src/app.css`
- Modify: `src/app.html`

**Step 1: Update `src/app.html` to set base font**

Replace `<body data-sveltekit-preload-data="hover">` with:
```html
<body data-sveltekit-preload-data="hover" class="font-sans antialiased">
```

**Step 2: Update `src/app.css` with font imports and theme tokens**

Replace the entire file with:

```css
@import "@fontsource-variable/geist-sans";
@import "@fontsource-variable/jetbrains-mono";
@import "tailwindcss";

@theme {
  --font-sans: "Geist Sans Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, monospace;

  --color-surface: #FAFAF9;
  --color-panel: #FFFFFF;
  --color-border: #E8E8E6;
  --color-primary: #2563EB;
  --color-sandbox: #6366F1;
  --color-success: #16A34A;
  --color-warning: #CA8A04;
  --color-danger: #DC2626;
  --color-coral: #F87171;
  --color-ink: #18181B;

  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

**Step 3: Verify the dev server picks up the theme**

Run: `npm run dev` (in background, then stop)
Run: `npm run check`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/app.css src/app.html
git commit -m "feat: configure Geist/JetBrains Mono fonts and color theme tokens"
```

---

## Task 3: Type Definitions

**Files:**
- Create: `src/lib/types/application.ts`
- Create: `src/lib/types/campaign.ts`
- Create: `src/lib/types/dashboard.ts`
- Modify: `src/lib/types/index.ts`

**Step 1: Create `src/lib/types/application.ts`**

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

**Step 2: Create `src/lib/types/campaign.ts`**

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

**Step 3: Create `src/lib/types/dashboard.ts`**

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

**Step 4: Update `src/lib/types/index.ts` to re-export all types**

```typescript
export * from './application'
export * from './campaign'
export * from './dashboard'
```

**Step 5: Type-check**

Run: `npm run check`
Expected: No errors.

**Step 6: Commit**

```bash
git add src/lib/types/
git commit -m "feat: add type definitions for Application, Campaign, and DashboardData"
```

---

## Task 4: Utility — Currency & Number Formatting

**Files:**
- Modify: `src/lib/utils/index.ts`

**Step 1: Write formatting utilities**

Replace `src/lib/utils/index.ts` with:

```typescript
/**
 * Format a number as SAR currency (abbreviated for large values).
 * Examples: 1234 → "SAR 1,234", 14450000 → "SAR 14.45M"
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `SAR ${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `SAR ${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `SAR ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }
  return `SAR ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

/**
 * Format a number with locale-aware thousand separators.
 * Examples: 1975 → "1,975"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

/**
 * Format a percentage with one decimal place.
 * Examples: 0.1234 → "12.3%", 1.80 → "1.80%"
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

/**
 * Abbreviate large revenue numbers for chart axis ticks.
 * Examples: 300000 → "300K", 1200000 → "1.2M"
 */
export function abbreviateNumber(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`
  }
  if (value >= 1_000) {
    const k = value / 1_000
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`
  }
  return String(value)
}

/**
 * Format an ISO date string for display.
 * Examples: "2026-02-18T..." → "18/02/2026"
 */
export function formatDate(isoDate: string): string {
  const d = new Date(isoDate)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}
```

**Step 2: Type-check**

Run: `npm run check`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/utils/index.ts
git commit -m "feat: add currency, number, and date formatting utilities"
```

---

## Task 5: Mock Data

**Files:**
- Create: `src/lib/mocks/applications.ts`
- Create: `src/lib/mocks/campaigns.ts`
- Create: `src/lib/mocks/dashboard.ts`

**Step 1: Create `src/lib/mocks/applications.ts`**

```typescript
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
```

**Step 2: Create `src/lib/mocks/campaigns.ts`**

```typescript
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
```

**Step 3: Create `src/lib/mocks/dashboard.ts`**

This file contains a helper to generate 90 days of revenue data, plus dashboard data keyed by application ID.

```typescript
import type { DashboardData, RevenueDataPoint, RevenueSummaryRow, PastWeekSummary, KpiData } from '$lib/types'

function generateRevenueData(days: number, baseRevenue: number, variance: number): RevenueDataPoint[] {
  const points: RevenueDataPoint[] = []
  const now = new Date('2026-02-21')
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const daily = baseRevenue + (Math.sin(i * 0.3) * variance) + ((i % 7 < 2) ? -variance * 0.3 : 0)
    points.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(Math.max(0, daily))
    })
  }
  return points
}

const ksaDashboard: DashboardData = {
  kpi: {
    running: 342,
    expiringSoon: 18,
    lowOnBudget: 7
  },
  revenueChart: generateRevenueData(90, 800_000, 200_000),
  pastWeekSummary: {
    influenceRate: 34.2,
    totalRevenue: 5_840_000,
    influencedRevenue: 1_997_280,
    revenueChange: 1.80,
    influencedChange: 3.24
  },
  revenueSummary: [
    {
      label: 'Total Revenue',
      yesterday: 812_000,
      past7Days: 5_840_000,
      pastMonth: 24_500_000,
      currentMonth: 16_200_000,
      past3Months: 72_400_000
    },
    {
      label: 'Influenced Revenue',
      yesterday: 278_000,
      past7Days: 1_997_280,
      pastMonth: 8_330_000,
      currentMonth: 5_508_000,
      past3Months: 24_616_000
    },
    {
      label: 'Influence Rate',
      yesterday: 34.24,
      past7Days: 34.20,
      pastMonth: 34.00,
      currentMonth: 34.00,
      past3Months: 34.00
    }
  ]
}

const uaeDashboard: DashboardData = {
  kpi: {
    running: 156,
    expiringSoon: 9,
    lowOnBudget: 3
  },
  revenueChart: generateRevenueData(90, 450_000, 120_000),
  pastWeekSummary: {
    influenceRate: 28.7,
    totalRevenue: 3_210_000,
    influencedRevenue: 921_270,
    revenueChange: 0.95,
    influencedChange: 2.10
  },
  revenueSummary: [
    {
      label: 'Total Revenue',
      yesterday: 465_000,
      past7Days: 3_210_000,
      pastMonth: 13_800_000,
      currentMonth: 9_100_000,
      past3Months: 40_200_000
    },
    {
      label: 'Influenced Revenue',
      yesterday: 133_455,
      past7Days: 921_270,
      pastMonth: 3_960_600,
      currentMonth: 2_611_700,
      past3Months: 11_537_400
    },
    {
      label: 'Influence Rate',
      yesterday: 28.70,
      past7Days: 28.70,
      pastMonth: 28.70,
      currentMonth: 28.70,
      past3Months: 28.70
    }
  ]
}

const sandboxDashboard: DashboardData = {
  kpi: {
    running: 12,
    expiringSoon: 2,
    lowOnBudget: 1
  },
  revenueChart: generateRevenueData(90, 50_000, 15_000),
  pastWeekSummary: {
    influenceRate: 42.1,
    totalRevenue: 345_000,
    influencedRevenue: 145_245,
    revenueChange: 5.20,
    influencedChange: 4.80
  },
  revenueSummary: [
    {
      label: 'Total Revenue',
      yesterday: 48_000,
      past7Days: 345_000,
      pastMonth: 1_480_000,
      currentMonth: 980_000,
      past3Months: 4_350_000
    },
    {
      label: 'Influenced Revenue',
      yesterday: 20_208,
      past7Days: 145_245,
      pastMonth: 623_080,
      currentMonth: 412_580,
      past3Months: 1_831_350
    },
    {
      label: 'Influence Rate',
      yesterday: 42.10,
      past7Days: 42.10,
      pastMonth: 42.10,
      currentMonth: 42.10,
      past3Months: 42.10
    }
  ]
}

export const mockDashboardData: Record<string, DashboardData> = {
  'app-1': ksaDashboard,
  'app-2': uaeDashboard,
  'app-3': sandboxDashboard,
  'app-4': sandboxDashboard
}
```

**Step 4: Remove `.gitkeep` placeholders from directories that now have files**

Run:
```bash
rm -f src/lib/mocks/.gitkeep src/lib/services/.gitkeep src/lib/stores/.gitkeep
```

(Only remove if they exist — some may not have `.gitkeep` files.)

**Step 5: Type-check**

Run: `npm run check`
Expected: No errors.

**Step 6: Commit**

```bash
git add src/lib/mocks/
git commit -m "feat: add Saudi-market mock data for applications, campaigns, and dashboard"
```

---

## Task 6: Service Layer

**Files:**
- Create: `src/lib/services/applicationService.ts`
- Create: `src/lib/services/campaignService.ts`
- Create: `src/lib/services/dashboardService.ts`

**Step 1: Create `src/lib/services/applicationService.ts`**

```typescript
import { mockApplications } from '$lib/mocks/applications'
import type { Application } from '$lib/types'

// GET /v1/applications
export async function getApplications(): Promise<Application[]> {
  return mockApplications
}

// GET /v1/applications/:id
export async function getApplication(id: string): Promise<Application | undefined> {
  return mockApplications.find((app) => app.id === id)
}
```

**Step 2: Create `src/lib/services/campaignService.ts`**

```typescript
import { mockRecentCampaigns } from '$lib/mocks/campaigns'
import type { Campaign } from '$lib/types'

// GET /v1/campaigns/recent?limit=:limit
export async function getRecentCampaigns(limit: number = 10): Promise<Campaign[]> {
  return mockRecentCampaigns.slice(0, limit)
}

// GET /v1/applications/:applicationId/campaigns
export async function getCampaignsByApplication(applicationId: string): Promise<Campaign[]> {
  return mockRecentCampaigns.filter((c) => c.applicationId === applicationId)
}
```

**Step 3: Create `src/lib/services/dashboardService.ts`**

```typescript
import { mockDashboardData } from '$lib/mocks/dashboard'
import type { DashboardData, TimeRange } from '$lib/types'

// GET /v1/applications/:applicationId/dashboard?range=:timeRange
export async function getDashboardData(
  applicationId: string,
  timeRange: TimeRange
): Promise<DashboardData | null> {
  return mockDashboardData[applicationId] ?? null
}
```

**Step 4: Type-check**

Run: `npm run check`
Expected: No errors.

**Step 5: Commit**

```bash
git add src/lib/services/
git commit -m "feat: add service layer (application, campaign, dashboard) with mock backends"
```

---

## Task 7: Stores — Application & Dashboard State

**Files:**
- Create: `src/lib/stores/applicationStore.svelte.ts`
- Create: `src/lib/stores/dashboardStore.svelte.ts`

**Step 1: Create `src/lib/stores/applicationStore.svelte.ts`**

```typescript
import { getApplications } from '$lib/services/applicationService'
import type { Application } from '$lib/types'

function createApplicationStore() {
  let applications = $state<Application[]>([])
  let selectedId = $state<string | null>(null)
  let searchQuery = $state('')
  let loading = $state(false)

  const selectedApplication = $derived(
    applications.find((a) => a.id === selectedId) ?? null
  )

  const filteredApplications = $derived(
    searchQuery
      ? applications.filter((a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : applications
  )

  async function loadApplications() {
    loading = true
    try {
      applications = await getApplications()
      if (applications.length > 0 && !selectedId) {
        selectedId = applications[0].id
      }
    } finally {
      loading = false
    }
  }

  function selectApplication(id: string) {
    selectedId = id
  }

  function setSearchQuery(query: string) {
    searchQuery = query
  }

  return {
    get applications() { return applications },
    get selectedId() { return selectedId },
    get selectedApplication() { return selectedApplication },
    get filteredApplications() { return filteredApplications },
    get searchQuery() { return searchQuery },
    get loading() { return loading },
    loadApplications,
    selectApplication,
    setSearchQuery
  }
}

export const applicationStore = createApplicationStore()
```

**Step 2: Create `src/lib/stores/dashboardStore.svelte.ts`**

```typescript
import { getDashboardData } from '$lib/services/dashboardService'
import type { DashboardData, TimeRange } from '$lib/types'

function createDashboardStore() {
  let data = $state<DashboardData | null>(null)
  let timeRange = $state<TimeRange>('30d')
  let loading = $state(false)

  async function loadDashboard(applicationId: string) {
    loading = true
    try {
      data = await getDashboardData(applicationId, timeRange)
    } finally {
      loading = false
    }
  }

  function setTimeRange(range: TimeRange) {
    timeRange = range
  }

  return {
    get data() { return data },
    get timeRange() { return timeRange },
    get loading() { return loading },
    loadDashboard,
    setTimeRange
  }
}

export const dashboardStore = createDashboardStore()
```

**Step 3: Type-check**

Run: `npm run check`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/lib/stores/
git commit -m "feat: add application and dashboard stores with Svelte 5 runes"
```

---

## Task 8: UI Primitives — Badge, Button, Card, Input

**Files:**
- Create: `src/lib/components/ui/Badge.svelte`
- Create: `src/lib/components/ui/Button.svelte`
- Create: `src/lib/components/ui/Card.svelte`
- Create: `src/lib/components/ui/Input.svelte`

**Step 1: Create `src/lib/components/ui/Badge.svelte`**

```svelte
<script lang="ts">
  let { variant, label, class: className = '' }: {
    variant: 'live' | 'sandbox'
    label: string
    class?: string
  } = $props()

  const variantClasses: Record<string, string> = {
    live: 'bg-success text-white',
    sandbox: 'bg-sandbox text-white'
  }
</script>

<span
  class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide {variantClasses[variant]} {className}"
>
  {label}
</span>
```

**Step 2: Create `src/lib/components/ui/Button.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    variant = 'primary',
    size = 'md',
    onclick,
    children,
    class: className = ''
  }: {
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md'
    onclick?: () => void
    children: Snippet
    class?: string
  } = $props()

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors rounded-full'

  const variantClasses: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-gray-100 text-ink hover:bg-gray-200',
    ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
  }

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm'
  }
</script>

<button
  class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
  onclick={onclick}
>
  {@render children()}
</button>
```

**Step 3: Create `src/lib/components/ui/Card.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children, class: className = '' }: {
    children: Snippet
    class?: string
  } = $props()
</script>

<div class="rounded-lg bg-panel p-4 shadow-card {className}">
  {@render children()}
</div>
```

**Step 4: Create `src/lib/components/ui/Input.svelte`**

```svelte
<script lang="ts">
  let {
    placeholder = '',
    value = $bindable(''),
    oninput,
    class: className = ''
  }: {
    placeholder?: string
    value?: string
    oninput?: (e: Event) => void
    class?: string
  } = $props()
</script>

<input
  type="text"
  {placeholder}
  bind:value
  {oninput}
  class="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-ink placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/20 {className}"
/>
```

**Step 5: Remove `.gitkeep` from ui directory if it exists**

Run: `rm -f src/lib/components/ui/.gitkeep`

**Step 6: Type-check**

Run: `npm run check`
Expected: No errors.

**Step 7: Commit**

```bash
git add src/lib/components/ui/Badge.svelte src/lib/components/ui/Button.svelte src/lib/components/ui/Card.svelte src/lib/components/ui/Input.svelte
git commit -m "feat: add Badge, Button, Card, and Input UI primitives"
```

---

## Task 9: UI Primitives — StatusDot, Tooltip, StatCard, SegmentedControl

**Files:**
- Create: `src/lib/components/ui/StatusDot.svelte`
- Create: `src/lib/components/ui/Tooltip.svelte`
- Create: `src/lib/components/ui/StatCard.svelte`
- Create: `src/lib/components/ui/SegmentedControl.svelte`

**Step 1: Create `src/lib/components/ui/StatusDot.svelte`**

```svelte
<script lang="ts">
  let { color, count, label, class: className = '' }: {
    color: 'success' | 'warning' | 'danger'
    count: number
    label: string
    class?: string
  } = $props()

  const colorClasses: Record<string, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger'
  }
</script>

<span class="inline-flex items-center gap-1.5 text-xs text-gray-500 {className}">
  <span class="inline-block h-2 w-2 rounded-full {colorClasses[color]}"></span>
  <span class="font-mono text-ink">{count.toLocaleString()}</span>
  {label}
</span>
```

**Step 2: Create `src/lib/components/ui/Tooltip.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte'

  let { text, children }: {
    text: string
    children: Snippet
  } = $props()
</script>

<span class="group relative inline-flex">
  {@render children()}
  <span
    class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
  >
    {text}
  </span>
</span>
```

**Step 3: Create `src/lib/components/ui/StatCard.svelte`**

```svelte
<script lang="ts">
  import { Info } from 'lucide-svelte'
  import Tooltip from './Tooltip.svelte'

  let { label, value, tooltip = '', class: className = '' }: {
    label: string
    value: number
    tooltip?: string
    class?: string
  } = $props()
</script>

<div class="rounded-lg bg-panel p-4 shadow-card {className}">
  <div class="flex items-center gap-1.5 text-xs text-gray-500">
    <span>{label}</span>
    {#if tooltip}
      <Tooltip text={tooltip}>
        <Info size={14} class="text-gray-400" />
      </Tooltip>
    {/if}
  </div>
  <div class="mt-2 font-mono text-3xl font-semibold text-ink">
    {value.toLocaleString()}
  </div>
</div>
```

**Step 4: Create `src/lib/components/ui/SegmentedControl.svelte`**

```svelte
<script lang="ts">
  let {
    options,
    selected = $bindable(),
    onchange,
    class: className = ''
  }: {
    options: { label: string; value: string }[]
    selected: string
    onchange?: (value: string) => void
    class?: string
  } = $props()
</script>

<div class="inline-flex rounded-lg border border-border bg-panel p-0.5 {className}">
  {#each options as option}
    <button
      class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {
        selected === option.value
          ? 'bg-primary text-white'
          : 'text-gray-500 hover:text-gray-700'
      }"
      onclick={() => {
        selected = option.value
        onchange?.(option.value)
      }}
    >
      {option.label}
    </button>
  {/each}
</div>
```

**Step 5: Type-check**

Run: `npm run check`
Expected: No errors.

**Step 6: Commit**

```bash
git add src/lib/components/ui/StatusDot.svelte src/lib/components/ui/Tooltip.svelte src/lib/components/ui/StatCard.svelte src/lib/components/ui/SegmentedControl.svelte
git commit -m "feat: add StatusDot, Tooltip, StatCard, and SegmentedControl UI primitives"
```

---

## Task 10: Layout — DashboardLayout & IconRail (Zone A)

**Files:**
- Create: `src/lib/components/layout/DashboardLayout.svelte`
- Create: `src/lib/components/layout/IconRail.svelte`
- Delete: `src/lib/components/layout/Header.svelte`
- Modify: `src/lib/components/layout/AppShell.svelte` (replace contents)
- Modify: `src/lib/components/layout/Sidebar.svelte` (replace contents — becomes unused, can delete)

**Step 1: Create `src/lib/components/layout/IconRail.svelte`**

```svelte
<script lang="ts">
  import {
    LayoutGrid,
    Heart,
    Gift,
    FileText,
    Users,
    Settings,
    User
  } from 'lucide-svelte'

  const navItems = [
    { label: 'Apps', icon: LayoutGrid, href: '/' },
    { label: 'Loyalty', icon: Heart, href: '#' },
    { label: 'Giveaways', icon: Gift, href: '#' },
    { label: 'Templates', icon: FileText, href: '#' },
    { label: 'Audiences', icon: Users, href: '#' }
  ]

  const bottomItems = [
    { label: 'Account', icon: Settings, href: '/settings' },
    { label: 'Profile', icon: User, href: '#' }
  ]

  let { activeHref = '/' }: { activeHref?: string } = $props()
</script>

<nav class="flex h-full w-14 flex-col items-center border-r border-border bg-panel py-4">
  <!-- Logo mark -->
  <div class="mb-6 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
    PF
  </div>

  <!-- Main nav -->
  <div class="flex flex-col items-center gap-1">
    {#each navItems as item}
      <a
        href={item.href}
        class="group flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-colors {
          activeHref === item.href
            ? 'text-primary'
            : 'text-gray-500 hover:text-gray-700'
        }"
      >
        <item.icon size={20} />
        <span class="text-[10px] leading-tight">{item.label}</span>
      </a>
    {/each}
  </div>

  <!-- Spacer -->
  <div class="mt-auto"></div>

  <!-- Bottom nav -->
  <div class="flex flex-col items-center gap-1">
    {#each bottomItems as item}
      <a
        href={item.href}
        class="group flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-colors {
          activeHref === item.href
            ? 'text-primary'
            : 'text-gray-500 hover:text-gray-700'
        }"
      >
        <item.icon size={20} />
        <span class="text-[10px] leading-tight">{item.label}</span>
      </a>
    {/each}
  </div>
</nav>
```

**Step 2: Create `src/lib/components/layout/DashboardLayout.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte'
  import IconRail from './IconRail.svelte'

  let { sidebar, children }: {
    sidebar: Snippet
    children: Snippet
  } = $props()
</script>

<div class="grid h-screen grid-cols-[56px_380px_1fr]">
  <IconRail />

  <!-- Zone B: Application Panel -->
  <aside class="overflow-y-auto border-r border-border bg-panel">
    {@render sidebar()}
  </aside>

  <!-- Zone C: Main Dashboard -->
  <main class="overflow-y-auto bg-surface">
    {@render children()}
  </main>
</div>
```

**Step 3: Delete `Header.svelte` and `Sidebar.svelte`, replace `AppShell.svelte`**

Delete `src/lib/components/layout/Header.svelte` and `src/lib/components/layout/Sidebar.svelte`:

Run:
```bash
rm src/lib/components/layout/Header.svelte src/lib/components/layout/Sidebar.svelte
```

Replace `src/lib/components/layout/AppShell.svelte` with a thin re-export of DashboardLayout (preserving the import path used in `+layout.svelte`):

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte'
  import DashboardLayout from './DashboardLayout.svelte'

  let { sidebar, children }: {
    sidebar: Snippet
    children: Snippet
  } = $props()
</script>

<DashboardLayout {sidebar}>
  {@render children()}
</DashboardLayout>
```

**Step 4: Update `src/routes/+layout.svelte` to pass sidebar snippet**

Replace contents with:

```svelte
<script lang="ts">
  import '../app.css'
  import AppShell from '$lib/components/layout/AppShell.svelte'
  import ApplicationPanel from '$lib/components/layout/ApplicationPanel.svelte'

  let { children } = $props()
</script>

<AppShell>
  {#snippet sidebar()}
    <ApplicationPanel />
  {/snippet}
  {@render children()}
</AppShell>
```

Note: `ApplicationPanel` doesn't exist yet — it will be created in Task 11. For now, create a temporary placeholder so the app compiles.

**Step 5: Create temporary `ApplicationPanel.svelte` placeholder**

Create `src/lib/components/layout/ApplicationPanel.svelte`:

```svelte
<div class="p-4">
  <p class="text-sm text-gray-400">Application panel — coming next</p>
</div>
```

**Step 6: Type-check and verify**

Run: `npm run check`
Expected: No errors.

**Step 7: Commit**

```bash
git add -A src/lib/components/layout/ src/routes/+layout.svelte
git commit -m "feat: replace AppShell with three-zone DashboardLayout and IconRail"
```

---

## Task 11: Zone B — ApplicationPanel, ApplicationCard, CampaignCard

**Files:**
- Modify: `src/lib/components/layout/ApplicationPanel.svelte`
- Create: `src/lib/components/dashboard/ApplicationCard.svelte`
- Create: `src/lib/components/dashboard/CampaignCard.svelte`

**Step 1: Create `src/lib/components/dashboard/ApplicationCard.svelte`**

```svelte
<script lang="ts">
  import { QrCode, Pencil } from 'lucide-svelte'
  import type { Application } from '$lib/types'
  import Badge from '$lib/components/ui/Badge.svelte'
  import StatusDot from '$lib/components/ui/StatusDot.svelte'

  let {
    application,
    selected = false,
    onclick
  }: {
    application: Application
    selected?: boolean
    onclick?: () => void
  } = $props()
</script>

<button
  class="group w-full cursor-pointer rounded-lg bg-panel p-4 text-left shadow-card transition-all hover:shadow-md {
    selected ? 'border-l-2 border-primary bg-blue-50/50' : 'border-l-2 border-transparent'
  }"
  onclick={onclick}
>
  <!-- Top row: badge + action icons -->
  <div class="flex items-start justify-between">
    <Badge
      variant={application.environment === 'live' ? 'live' : 'sandbox'}
      label={application.environment === 'live' ? 'LIVE' : 'SANDBOX'}
    />
    <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <span class="rounded p-1 text-gray-400 hover:text-gray-600">
        <QrCode size={14} />
      </span>
      <span class="rounded p-1 text-gray-400 hover:text-gray-600">
        <Pencil size={14} />
      </span>
    </div>
  </div>

  <!-- App name -->
  <h3 class="mt-2 text-base font-bold text-ink">{application.name}</h3>

  <!-- Campaign count -->
  <p class="mt-1 text-xs uppercase tracking-wide text-gray-500">
    {application.campaignCount.toLocaleString()} campaigns
  </p>

  <!-- Status breakdown -->
  <div class="mt-3 flex gap-4">
    <StatusDot color="success" count={application.runningCount} label="running" />
    <StatusDot color="warning" count={application.disabledCount} label="disabled" />
    <StatusDot color="danger" count={application.expiredCount} label="expired" />
  </div>
</button>
```

**Step 2: Create `src/lib/components/dashboard/CampaignCard.svelte`**

```svelte
<script lang="ts">
  import type { Campaign } from '$lib/types'
  import { formatDate } from '$lib/utils'

  let { campaign }: { campaign: Campaign } = $props()

  const statusColors: Record<string, string> = {
    running: 'bg-success',
    disabled: 'bg-warning',
    expired: 'bg-danger'
  }

  const envColors: Record<string, string> = {
    'KSA PRODUCTION': 'bg-success',
    'UAE PRODUCTION': 'bg-success',
    'KSA SANDBOX': 'bg-sandbox',
    'UAE SANDBOX': 'bg-sandbox'
  }
</script>

<div class="rounded-lg bg-panel p-3 shadow-card">
  <!-- App badge -->
  <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-400">
    <span class="inline-block h-2 w-2 rounded-sm {envColors[campaign.applicationName] ?? 'bg-gray-300'}"></span>
    {campaign.applicationName}
  </div>

  <!-- Campaign name with status dot -->
  <div class="mt-1.5 flex items-center gap-1.5">
    <span class="inline-block h-2 w-2 rounded-full {statusColors[campaign.status]}"></span>
    <span class="text-sm font-medium text-ink">{campaign.name}</span>
  </div>

  <!-- Updated info -->
  <p class="mt-1 text-[11px] text-gray-400">
    Updated {formatDate(campaign.updatedAt)} by {campaign.updatedBy}
  </p>
</div>
```

**Step 3: Replace `src/lib/components/layout/ApplicationPanel.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { getRecentCampaigns } from '$lib/services/campaignService'
  import type { Campaign } from '$lib/types'
  import Input from '$lib/components/ui/Input.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import ApplicationCard from '$lib/components/dashboard/ApplicationCard.svelte'
  import CampaignCard from '$lib/components/dashboard/CampaignCard.svelte'

  let recentCampaigns = $state<Campaign[]>([])

  onMount(async () => {
    await applicationStore.loadApplications()
    recentCampaigns = await getRecentCampaigns(8)
  })
</script>

<div class="flex flex-col gap-4 p-4">
  <!-- Search + Create -->
  <div class="flex gap-2">
    <Input
      placeholder="Search Applications"
      value={applicationStore.searchQuery}
      oninput={(e) => applicationStore.setSearchQuery((e.target as HTMLInputElement).value)}
      class="flex-1"
    />
    <Button variant="primary" size="sm">+ Create</Button>
  </div>

  <!-- Application cards -->
  <div class="flex flex-col gap-3">
    {#each applicationStore.filteredApplications as app (app.id)}
      <ApplicationCard
        application={app}
        selected={applicationStore.selectedId === app.id}
        onclick={() => applicationStore.selectApplication(app.id)}
      />
    {/each}
  </div>

  <!-- Recently Updated Campaigns -->
  <div class="mt-4">
    <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
      Recently Updated Campaigns
    </h3>
    <div class="flex flex-col gap-2">
      {#each recentCampaigns as campaign (campaign.id)}
        <CampaignCard {campaign} />
      {/each}
    </div>
  </div>
</div>
```

**Step 4: Type-check**

Run: `npm run check`
Expected: No errors.

**Step 5: Commit**

```bash
git add src/lib/components/dashboard/ApplicationCard.svelte src/lib/components/dashboard/CampaignCard.svelte src/lib/components/layout/ApplicationPanel.svelte
git commit -m "feat: build ApplicationPanel (Zone B) with ApplicationCard and CampaignCard"
```

---

## Task 12: Zone C — Dashboard Page (KPI Row, Banner, App Selector)

**Files:**
- Modify: `src/routes/+page.svelte`

**Step 1: Replace `src/routes/+page.svelte` with the Zone C dashboard content**

```svelte
<script lang="ts">
  import { X, Info, ChevronDown } from 'lucide-svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { dashboardStore } from '$lib/stores/dashboardStore.svelte'
  import StatCard from '$lib/components/ui/StatCard.svelte'
  import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import type { TimeRange } from '$lib/types'

  let showBanner = $state(true)
  let showAppDropdown = $state(false)

  const timeRangeOptions = [
    { label: 'Custom', value: 'custom' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '3M', value: '3m' },
    { label: '6M', value: '6m' },
    { label: 'YTD', value: 'ytd' },
    { label: 'Max', value: 'max' }
  ]

  // Reactively load dashboard data when selected app changes
  $effect(() => {
    const appId = applicationStore.selectedId
    if (appId) {
      dashboardStore.loadDashboard(appId)
    }
  })

  function handleTimeRangeChange(value: string) {
    dashboardStore.setTimeRange(value as TimeRange)
    const appId = applicationStore.selectedId
    if (appId) {
      dashboardStore.loadDashboard(appId)
    }
  }

  function selectAppFromDropdown(id: string) {
    applicationStore.selectApplication(id)
    showAppDropdown = false
  }
</script>

<div class="p-6">
  <!-- Header -->
  <h1 class="text-xl font-bold text-ink">My Account Dashboard</h1>

  <!-- Dismissible info banner -->
  {#if showBanner}
    <div class="mt-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
      <div class="flex items-center gap-2">
        <Info size={16} />
        <span>Dashboard updated daily at 11:59pm UTC. Data collected since 12/06/2021.</span>
      </div>
      <button onclick={() => showBanner = false} class="text-blue-400 hover:text-blue-600">
        <X size={16} />
      </button>
    </div>
  {/if}

  <!-- Application selector dropdown -->
  <div class="mt-6">
    <label class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Application</label>
    <div class="relative mt-1">
      <button
        class="flex w-64 items-center justify-between rounded-lg border border-border bg-panel px-3 py-2 text-sm text-ink"
        onclick={() => showAppDropdown = !showAppDropdown}
      >
        <span class="flex items-center gap-2">
          {#if applicationStore.selectedApplication}
            <Badge
              variant={applicationStore.selectedApplication.environment === 'live' ? 'live' : 'sandbox'}
              label={applicationStore.selectedApplication.environment === 'live' ? 'LIVE' : 'SB'}
            />
            {applicationStore.selectedApplication.name}
          {:else}
            Select application
          {/if}
        </span>
        <ChevronDown size={16} class="text-gray-400" />
      </button>

      {#if showAppDropdown}
        <div class="absolute z-10 mt-1 w-64 rounded-lg border border-border bg-panel py-1 shadow-card">
          {#each applicationStore.applications as app (app.id)}
            <button
              class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 {
                applicationStore.selectedId === app.id ? 'bg-blue-50 text-primary' : 'text-ink'
              }"
              onclick={() => selectAppFromDropdown(app.id)}
            >
              <Badge
                variant={app.environment === 'live' ? 'live' : 'sandbox'}
                label={app.environment === 'live' ? 'LIVE' : 'SB'}
              />
              {app.name}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- KPI Row -->
  {#if dashboardStore.data}
    <div class="mt-6">
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Campaign Highlights</h2>
      <div class="grid grid-cols-3 gap-4">
        <StatCard
          label="Running"
          value={dashboardStore.data.kpi.running}
          tooltip="Number of currently active campaigns"
        />
        <StatCard
          label="Expiring soon"
          value={dashboardStore.data.kpi.expiringSoon}
          tooltip="Campaigns expiring within the next 7 days"
        />
        <StatCard
          label="Low on budget"
          value={dashboardStore.data.kpi.lowOnBudget}
          tooltip="Campaigns with less than 10% budget remaining"
        />
      </div>
    </div>

    <!-- Time Range Selector -->
    <div class="mt-6 flex justify-end">
      <SegmentedControl
        options={timeRangeOptions}
        selected={dashboardStore.timeRange}
        onchange={handleTimeRangeChange}
      />
    </div>

    <!-- Charts area placeholder — filled in Task 13 -->
    <div class="mt-4 grid grid-cols-[1fr_220px] gap-4">
      <div class="flex h-80 items-center justify-center rounded-lg bg-panel shadow-card">
        <span class="text-sm text-gray-400">Revenue chart — next task</span>
      </div>
      <div class="flex h-80 items-center justify-center rounded-lg bg-panel shadow-card">
        <span class="text-sm text-gray-400">Past 7 days — next task</span>
      </div>
    </div>

    <!-- Table placeholder — filled in Task 14 -->
    <div class="mt-4 flex h-48 items-center justify-center rounded-lg bg-panel shadow-card">
      <span class="text-sm text-gray-400">Revenue summary table — next task</span>
    </div>
  {/if}
</div>
```

**Step 2: Type-check**

Run: `npm run check`
Expected: No errors.

**Step 3: Visually verify**

Run: `npm run dev`
Expected: Three-zone layout visible. Icon rail on left, application panel in middle with cards, dashboard on right with KPI cards, time range selector, and placeholder areas.

**Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: build Zone C dashboard page with KPI row, app selector, and time range control"
```

---

## Task 13: Charts — RevenueChart & DonutChart

**Files:**
- Create: `src/lib/components/dashboard/RevenueChart.svelte`
- Create: `src/lib/components/dashboard/DonutChart.svelte`
- Create: `src/lib/components/dashboard/PastWeekCard.svelte`
- Modify: `src/routes/+page.svelte` — replace chart placeholders

**Important note on LayerChart:** LayerChart is a Svelte-native charting library. Check LayerChart docs/examples for exact API before implementing. The component names below are based on typical LayerChart patterns (`Chart`, `Svg`, `Area`, `Line`, `Axis`, `Arc`). If the actual exports differ, adapt accordingly. The key visual requirements are:

- Revenue chart: coral line + gradient fill area, X/Y axes, responsive
- Donut chart: coral arc on gray track, centered percentage label

**Step 1: Create `src/lib/components/dashboard/RevenueChart.svelte`**

Build a line+area chart using LayerChart. The component receives `data: RevenueDataPoint[]` as a prop.

```svelte
<script lang="ts">
  import { Chart, Svg, Area, Spline, Axis, Highlight, Tooltip as ChartTooltip, TooltipItem } from 'layerchart'
  import { scaleTime, scaleLinear } from 'd3-scale'
  import { format } from 'date-fns'
  import type { RevenueDataPoint } from '$lib/types'
  import { abbreviateNumber, formatCurrency } from '$lib/utils'

  let { data, class: className = '' }: {
    data: RevenueDataPoint[]
    class?: string
  } = $props()

  const chartData = $derived(
    data.map((d) => ({ ...d, dateObj: new Date(d.date) }))
  )
</script>

<div class="h-full w-full rounded-lg bg-panel p-4 shadow-card {className}">
  <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Revenue Overview</h3>
  <div class="h-[calc(100%-28px)]">
    <Chart
      data={chartData}
      x="dateObj"
      xScale={scaleTime()}
      y="revenue"
      yScale={scaleLinear()}
      yDomain={[0, null]}
      yNice
      padding={{ left: 60, bottom: 30, top: 10, right: 10 }}
    >
      <Svg>
        <Axis placement="left" format={(d) => abbreviateNumber(d)} />
        <Axis placement="bottom" format={(d) => format(d, 'MMM d')} />
        <Area line={{ class: 'stroke-coral stroke-2' }} class="fill-coral/20" />
        <Spline class="stroke-coral stroke-2" />
        <Highlight points lines />
      </Svg>
      <ChartTooltip header={(d) => format(d.dateObj, 'MMM d, yyyy')} let:data>
        <TooltipItem label="Revenue" value={formatCurrency(data.revenue)} />
      </ChartTooltip>
    </Chart>
  </div>
</div>
```

**Important:** The exact LayerChart API may differ. If `Area`, `Spline`, `Highlight`, or `Tooltip`/`TooltipItem` don't exist with these exact names, look at `node_modules/layerchart/dist/` exports and adapt. The visual requirements are: coral line, area fill below the line with 20% opacity, left axis with abbreviated numbers, bottom axis with dates.

**Step 2: Create `src/lib/components/dashboard/DonutChart.svelte`**

```svelte
<script lang="ts">
  import { Chart, Svg, Arc } from 'layerchart'

  let { percentage, class: className = '' }: {
    percentage: number
    class?: string
  } = $props()

  // Two-segment data: filled portion and remaining
  const segments = $derived([
    { label: 'Influenced', value: percentage },
    { label: 'Remaining', value: 100 - percentage }
  ])
</script>

<div class="relative {className}">
  <Chart data={segments} x="label" y="value">
    <Svg>
      <Arc
        innerRadius={0.7}
        padAngle={0.02}
        cornerRadius={2}
        let:segment
      >
        <path
          d={segment.path}
          fill={segment.data.label === 'Influenced' ? '#F87171' : '#E5E7EB'}
        />
      </Arc>
    </Svg>
  </Chart>
  <!-- Centered percentage label -->
  <div class="absolute inset-0 flex items-center justify-center">
    <span class="font-mono text-2xl font-bold text-ink">{percentage}%</span>
  </div>
</div>
```

**Important:** Same note — adapt the Arc/pie API to match actual LayerChart exports. The visual requirement: donut ring with coral fill on gray track, percentage centered.

**Step 3: Create `src/lib/components/dashboard/PastWeekCard.svelte`**

```svelte
<script lang="ts">
  import { TrendingUp } from 'lucide-svelte'
  import type { PastWeekSummary } from '$lib/types'
  import { formatCurrency, formatPercent } from '$lib/utils'
  import DonutChart from './DonutChart.svelte'

  let { summary, class: className = '' }: {
    summary: PastWeekSummary
    class?: string
  } = $props()
</script>

<div class="rounded-lg bg-panel p-4 shadow-card {className}">
  <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-400">Past 7 Days</h3>

  <!-- Donut chart -->
  <div class="mx-auto my-4 h-28 w-28">
    <DonutChart percentage={summary.influenceRate} class="h-full w-full" />
  </div>

  <!-- Metrics -->
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-xs text-gray-500">Total Revenue</span>
      <div class="flex items-center gap-1">
        <span class="font-mono text-sm font-semibold text-ink">{formatCurrency(summary.totalRevenue)}</span>
        <span class="flex items-center text-[10px] text-success">
          <TrendingUp size={10} />
          {formatPercent(summary.revenueChange)}
        </span>
      </div>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-xs text-gray-500">Influenced Revenue</span>
      <div class="flex items-center gap-1">
        <span class="font-mono text-sm font-semibold text-ink">{formatCurrency(summary.influencedRevenue)}</span>
        <span class="flex items-center text-[10px] text-success">
          <TrendingUp size={10} />
          {formatPercent(summary.influencedChange)}
        </span>
      </div>
    </div>
  </div>
</div>
```

**Step 4: Update `src/routes/+page.svelte` — replace chart placeholders**

Find the chart placeholder section:
```svelte
    <!-- Charts area placeholder — filled in Task 13 -->
    <div class="mt-4 grid grid-cols-[1fr_220px] gap-4">
      <div class="flex h-80 items-center justify-center rounded-lg bg-panel shadow-card">
        <span class="text-sm text-gray-400">Revenue chart — next task</span>
      </div>
      <div class="flex h-80 items-center justify-center rounded-lg bg-panel shadow-card">
        <span class="text-sm text-gray-400">Past 7 days — next task</span>
      </div>
    </div>
```

Replace with:
```svelte
    <!-- Charts area -->
    <div class="mt-4 grid grid-cols-[1fr_220px] gap-4">
      <RevenueChart data={dashboardStore.data.revenueChart} class="h-80" />
      <PastWeekCard summary={dashboardStore.data.pastWeekSummary} />
    </div>
```

Add imports at the top of the `<script>` block:
```typescript
  import RevenueChart from '$lib/components/dashboard/RevenueChart.svelte'
  import PastWeekCard from '$lib/components/dashboard/PastWeekCard.svelte'
```

**Step 5: Install d3-scale and date-fns (LayerChart peer deps if needed)**

Run:
```bash
npm install d3-scale date-fns
npm install -D @types/d3-scale
```

**Step 6: Type-check and fix any LayerChart API issues**

Run: `npm run check`

If there are import errors from LayerChart, inspect the actual exports:
```bash
ls node_modules/layerchart/dist/lib/components/
```

Adapt component names as needed. The chart visuals matter more than the exact import paths.

**Step 7: Commit**

```bash
git add src/lib/components/dashboard/RevenueChart.svelte src/lib/components/dashboard/DonutChart.svelte src/lib/components/dashboard/PastWeekCard.svelte src/routes/+page.svelte package.json package-lock.json
git commit -m "feat: add RevenueChart, DonutChart, and PastWeekCard with LayerChart"
```

---

## Task 14: Revenue Summary Table

**Files:**
- Create: `src/lib/components/dashboard/RevenueSummaryTable.svelte`
- Modify: `src/routes/+page.svelte` — replace table placeholder

**Step 1: Create `src/lib/components/dashboard/RevenueSummaryTable.svelte`**

```svelte
<script lang="ts">
  import { Info } from 'lucide-svelte'
  import type { RevenueSummaryRow } from '$lib/types'
  import { formatCurrency, formatPercent } from '$lib/utils'
  import Tooltip from '$lib/components/ui/Tooltip.svelte'

  let { rows, class: className = '' }: {
    rows: RevenueSummaryRow[]
    class?: string
  } = $props()

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' }).toUpperCase()

  const columns = [
    { key: 'yesterday', label: 'YESTERDAY' },
    { key: 'past7Days', label: 'PAST 7 DAYS' },
    { key: 'pastMonth', label: 'PAST MONTH' },
    { key: 'currentMonth', label: currentMonthName },
    { key: 'past3Months', label: 'PAST 3 MONTHS' }
  ] as const

  const rowMeta: Record<string, { color: string; tooltip: string }> = {
    'Total Revenue': {
      color: 'bg-primary',
      tooltip: 'Total revenue from all transactions in this period'
    },
    'Influenced Revenue': {
      color: 'bg-coral',
      tooltip: 'Revenue from transactions that used a promotion'
    },
    'Influence Rate': {
      color: '',
      tooltip: ''
    }
  }

  function formatCell(row: RevenueSummaryRow, key: string): string {
    const value = row[key as keyof RevenueSummaryRow] as number
    if (row.label === 'Influence Rate') return formatPercent(value)
    return formatCurrency(value)
  }
</script>

<div class="rounded-lg bg-panel p-4 shadow-card {className}">
  <table class="w-full">
    <thead>
      <tr class="border-b border-border">
        <th class="pb-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400"></th>
        {#each columns as col}
          <th class="pb-3 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {col.label}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr class="border-b border-border last:border-b-0 hover:bg-gray-50">
          <td class="py-3 pr-4">
            <div class="flex items-center gap-2">
              {#if rowMeta[row.label]?.color}
                <span class="inline-block h-2.5 w-2.5 rounded-sm {rowMeta[row.label].color}"></span>
              {/if}
              <span class="text-sm font-medium text-ink">{row.label}</span>
              {#if rowMeta[row.label]?.tooltip}
                <Tooltip text={rowMeta[row.label].tooltip}>
                  <Info size={14} class="text-gray-400" />
                </Tooltip>
              {/if}
            </div>
          </td>
          {#each columns as col}
            <td class="py-3 text-right font-mono text-sm text-ink">
              {formatCell(row, col.key)}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
```

**Step 2: Update `src/routes/+page.svelte` — replace table placeholder**

Find:
```svelte
    <!-- Table placeholder — filled in Task 14 -->
    <div class="mt-4 flex h-48 items-center justify-center rounded-lg bg-panel shadow-card">
      <span class="text-sm text-gray-400">Revenue summary table — next task</span>
    </div>
```

Replace with:
```svelte
    <!-- Revenue Summary Table -->
    <RevenueSummaryTable rows={dashboardStore.data.revenueSummary} class="mt-4" />
```

Add import at the top of the `<script>` block:
```typescript
  import RevenueSummaryTable from '$lib/components/dashboard/RevenueSummaryTable.svelte'
```

**Step 3: Type-check**

Run: `npm run check`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/lib/components/dashboard/RevenueSummaryTable.svelte src/routes/+page.svelte
git commit -m "feat: add RevenueSummaryTable with SAR formatting and colored indicators"
```

---

## Task 15: Polish — Close Dropdown on Outside Click, Hover States, Animations

**Files:**
- Modify: `src/routes/+page.svelte` — close dropdown on outside click
- Verify all hover states work across components

**Step 1: Add outside-click handler for the application dropdown**

In `src/routes/+page.svelte`, add a `svelte:window` click handler to close the dropdown when clicking outside. Wrap the dropdown `<div class="relative mt-1">` with an onclick stop-propagation, and add a window handler:

Add this inside the `<script>` block:
```typescript
  function handleWindowClick() {
    showAppDropdown = false
  }
```

Add this at the top of the template (before the container div):
```svelte
<svelte:window onclick={handleWindowClick} />
```

Add `onclick|stopPropagation` on the dropdown trigger button and dropdown menu to prevent them from closing the dropdown:

On the dropdown trigger button, change `onclick={() => showAppDropdown = !showAppDropdown}` to:
```svelte
onclick|stopPropagation={() => showAppDropdown = !showAppDropdown}
```

On the dropdown menu div, add:
```svelte
onclick|stopPropagation
```

**Step 2: Verify hover states**

Visually verify in the browser (`npm run dev`):
- App cards: hover shows shadow + QR/edit icons appear
- Nav items: hover changes color
- Table rows: hover shows light gray background
- Buttons: hover shows color transition

**Step 3: Type-check**

Run: `npm run check`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: add outside-click dropdown close and verify hover states"
```

---

## Task 16: Final Verification & Cleanup

**Files:**
- Remove: any remaining `.gitkeep` files in directories that now have content
- Verify: all files

**Step 1: Remove stale `.gitkeep` files**

Run:
```bash
find src/lib -name ".gitkeep" -type f
```

Delete any that are in directories with real files now.

**Step 2: Full type-check**

Run: `npm run check`
Expected: No errors.

**Step 3: Full build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 4: Visual smoke test**

Run: `npm run dev` and verify in browser:
1. Three-zone layout renders (icon rail, app panel, dashboard)
2. Icon rail shows nav items with correct icons
3. Application cards render with badges, counts, status dots
4. Clicking an app card highlights it and refreshes dashboard
5. KPI row shows three stat cards with correct numbers
6. Time range segmented control works (switches active state)
7. Revenue chart renders with coral line and gradient fill
8. Past 7 Days card shows donut + metrics
9. Revenue summary table shows correct data with SAR formatting
10. Application dropdown opens/closes, selecting an app updates everything
11. Info banner dismisses on × click
12. Search filters application cards
13. Tooltips appear on hover over info icons
14. Recently updated campaigns display below app cards

**Step 5: Commit any cleanup**

```bash
git add -A
git commit -m "chore: remove stale .gitkeep files and finalize dashboard build"
```

---

## Summary: File Inventory

### Created (new files)
- `src/lib/types/application.ts`
- `src/lib/types/campaign.ts`
- `src/lib/types/dashboard.ts`
- `src/lib/mocks/applications.ts`
- `src/lib/mocks/campaigns.ts`
- `src/lib/mocks/dashboard.ts`
- `src/lib/services/applicationService.ts`
- `src/lib/services/campaignService.ts`
- `src/lib/services/dashboardService.ts`
- `src/lib/stores/applicationStore.svelte.ts`
- `src/lib/stores/dashboardStore.svelte.ts`
- `src/lib/components/ui/Badge.svelte`
- `src/lib/components/ui/Button.svelte`
- `src/lib/components/ui/Card.svelte`
- `src/lib/components/ui/Input.svelte`
- `src/lib/components/ui/StatusDot.svelte`
- `src/lib/components/ui/Tooltip.svelte`
- `src/lib/components/ui/StatCard.svelte`
- `src/lib/components/ui/SegmentedControl.svelte`
- `src/lib/components/layout/DashboardLayout.svelte`
- `src/lib/components/layout/IconRail.svelte`
- `src/lib/components/dashboard/ApplicationCard.svelte`
- `src/lib/components/dashboard/CampaignCard.svelte`
- `src/lib/components/dashboard/RevenueChart.svelte`
- `src/lib/components/dashboard/DonutChart.svelte`
- `src/lib/components/dashboard/PastWeekCard.svelte`
- `src/lib/components/dashboard/RevenueSummaryTable.svelte`

### Modified (existing files)
- `package.json` — new dependencies
- `src/app.css` — fonts + theme tokens
- `src/app.html` — font class on body
- `src/lib/types/index.ts` — re-exports
- `src/lib/utils/index.ts` — formatting utilities
- `src/lib/components/layout/AppShell.svelte` — delegates to DashboardLayout
- `src/routes/+layout.svelte` — passes sidebar snippet
- `src/routes/+page.svelte` — full dashboard page

### Deleted
- `src/lib/components/layout/Header.svelte`
- `src/lib/components/layout/Sidebar.svelte`
- Various `.gitkeep` files
