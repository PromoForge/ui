# Campaign Detail Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the campaign detail view with a sidebar nav swap (application → campaign context) and a full campaign Dashboard page showing Details, State, Schedule, Rules, Performance cards plus a dismissible activation banner.

**Architecture:** The existing `applications/[id]/+layout.svelte` conditionally renders either `ApplicationContextPanel` or `CampaignContextPanel` based on whether the URL includes a `campaignId` segment. A nested `[campaignId]/+layout.svelte` loads the campaign data. The Dashboard page is composed of 5 card components plus an activation banner, all backed by mock data through a dedicated store.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Tailwind CSS v4, TypeScript, Lucide Svelte icons

**Design doc:** `docs/plans/2026-02-22-campaign-detail-design.md`

---

### Task 1: Extend types for campaign detail

Add the new `CampaignDetail`, `CampaignRule`, and `CampaignBudget` types alongside the existing campaign types.

**Files:**
- Modify: `src/lib/types/campaign.ts`
- Verify: `src/lib/types/index.ts` (already re-exports `campaign.ts`)

**Step 1: Add new types to campaign.ts**

Add the following after the existing `CampaignListItem` interface (do NOT remove any existing types):

```typescript
// --- Campaign Detail Page types ---

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
```

**Step 2: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/types/campaign.ts
git commit -m "feat: add CampaignDetail, CampaignRule, CampaignBudget types"
```

---

### Task 2: Create mock campaign detail data

Generate ~5 detailed `CampaignDetail` entries matching existing `CampaignListItem` IDs so clicking from the list loads realistic data.

**Files:**
- Create: `src/lib/mocks/campaignDetail.ts`

**Step 1: Create the mock data file**

```typescript
// src/lib/mocks/campaignDetail.ts
import type { CampaignDetail } from '$lib/types'

export const mockCampaignDetails: CampaignDetail[] = [
  {
    id: 'cl-006',
    applicationId: 'app-1',
    name: 'New User Welcome Voucher',
    status: 'running',
    description: 'SAR 30 off first purchase for new users. Minimum order value SAR 100.',
    category: 'Acquisition',
    productList: 'All products',
    tags: ['new-user', 'welcome', 'voucher'],
    rules: [
      { name: 'Coupon Valid >150', conditions: 7, effects: 1 },
      { name: 'Coupon Valid <150', conditions: 7, effects: 1 },
      { name: 'Order Placed > 150', conditions: 6, effects: 1 },
      { name: 'Order Placed < 150', conditions: 6, effects: 1 }
    ],
    budgets: [
      { label: 'Set Discount', type: 'no recurrence', current: 0, limit: 10000, recurrence: null },
      { label: 'Redeem Coupon', type: 'no recurrence', current: 0, limit: 1000000, recurrence: null }
    ],
    schedule: { startDate: '2026-01-01T00:00:00Z', endDate: '2026-06-30T23:59:59Z' },
    lastUpdatedAt: '2026-02-22T11:45:00Z',
    lastUpdatedBy: 'Sara Al Harbi'
  },
  {
    id: 'cl-008',
    applicationId: 'app-1',
    name: 'Free Shipping Over SAR 200',
    status: 'running',
    description: '15% off up to 15 – MOV=150',
    category: 'Beauty',
    productList: '1month – list of products',
    tags: [],
    rules: [
      { name: 'Coupon Valid >150', conditions: 7, effects: 1 },
      { name: 'Coupon Valid <150', conditions: 7, effects: 1 },
      { name: 'Order Placed > 150', conditions: 6, effects: 1 },
      { name: 'Order Placed < 150', conditions: 6, effects: 1 }
    ],
    budgets: [
      { label: 'Set Discount', type: 'no recurrence', current: 0, limit: 10000, recurrence: null },
      { label: 'Redeem Coupon', type: 'no recurrence', current: 0, limit: 1000000, recurrence: null }
    ],
    schedule: { startDate: null, endDate: null },
    lastUpdatedAt: '2026-01-04T12:56:00Z',
    lastUpdatedBy: 'Fatima Al Enezi'
  },
  {
    id: 'cl-009',
    applicationId: 'app-1',
    name: 'Buy 2 Get 1 Free Electronics',
    status: 'running',
    description: 'Buy any 2 electronics items and get the cheapest one free.',
    category: 'Electronics',
    productList: 'Electronics category',
    tags: ['bogo', 'electronics'],
    rules: [
      { name: 'Cart Contains 2+ Electronics', conditions: 3, effects: 1 },
      { name: 'Apply Free Item Discount', conditions: 2, effects: 1 }
    ],
    budgets: [
      { label: 'Set Discount', type: 'per session', current: 567, limit: 5000, recurrence: 'per session' }
    ],
    schedule: { startDate: '2026-02-10T00:00:00Z', endDate: '2026-02-25T23:59:59Z' },
    lastUpdatedAt: '2026-02-21T17:00:00Z',
    lastUpdatedBy: 'Ahmed Mansour'
  },
  {
    id: 'cl-017',
    applicationId: 'app-1',
    name: 'First Purchase 20% Off',
    status: 'running',
    description: '20% discount on first order. Maximum discount SAR 100.',
    category: 'Acquisition',
    productList: 'All products',
    tags: ['first-purchase', 'acquisition'],
    rules: [
      { name: 'Is First Purchase', conditions: 4, effects: 1 },
      { name: 'Apply 20% Discount', conditions: 2, effects: 1 },
      { name: 'Cap at SAR 100', conditions: 1, effects: 1 }
    ],
    budgets: [
      { label: 'Set Discount', type: 'no recurrence', current: 12340, limit: 50000, recurrence: null },
      { label: 'Redeem Coupon', type: 'monthly', current: 987, limit: 5000, recurrence: 'monthly' }
    ],
    schedule: { startDate: '2025-06-01T00:00:00Z', endDate: '2026-05-31T23:59:59Z' },
    lastUpdatedAt: '2026-02-22T13:00:00Z',
    lastUpdatedBy: 'Khalid Ibrahim'
  },
  {
    id: 'cl-021',
    applicationId: 'app-1',
    name: 'National Day Sale 2025',
    status: 'expired',
    description: 'Up to 50% off all categories for National Day celebration.',
    category: 'Seasonal',
    productList: 'All products',
    tags: ['national-day', 'seasonal', '2025'],
    rules: [
      { name: 'Apply Category Discount', conditions: 5, effects: 3 },
      { name: 'VIP Extra 10%', conditions: 3, effects: 1 }
    ],
    budgets: [
      { label: 'Set Discount', type: 'no recurrence', current: 15600, limit: 20000, recurrence: null }
    ],
    schedule: { startDate: '2025-09-20T00:00:00Z', endDate: '2025-09-25T23:59:59Z' },
    lastUpdatedAt: '2025-09-25T23:59:59Z',
    lastUpdatedBy: 'Abdulrahman Al Mutairi'
  }
]
```

**Step 2: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/mocks/campaignDetail.ts
git commit -m "feat: add mock campaign detail data (5 entries)"
```

---

### Task 3: Create campaign detail service and store

**Files:**
- Create: `src/lib/services/campaignDetailService.ts`
- Create: `src/lib/stores/campaignDetailStore.svelte.ts`

**Step 1: Create the service file**

```typescript
// src/lib/services/campaignDetailService.ts
import { mockCampaignDetails } from '$lib/mocks/campaignDetail'
import type { CampaignDetail } from '$lib/types'

// GET /v1/campaigns/:campaignId
export async function getCampaignDetail(campaignId: string): Promise<CampaignDetail | null> {
  return mockCampaignDetails.find((c) => c.id === campaignId) ?? null
}
```

**Step 2: Create the store file**

```typescript
// src/lib/stores/campaignDetailStore.svelte.ts
import { getCampaignDetail } from '$lib/services/campaignDetailService'
import type { CampaignDetail } from '$lib/types'

function createCampaignDetailStore() {
  let campaign = $state<CampaignDetail | null>(null)
  let loading = $state(false)

  const hasSchedule = $derived(
    campaign?.schedule.startDate !== null || campaign?.schedule.endDate !== null
  )

  const isRunning = $derived(campaign?.status === 'running')

  async function loadCampaign(campaignId: string) {
    loading = true
    try {
      campaign = await getCampaignDetail(campaignId)
    } finally {
      loading = false
    }
  }

  function clear() {
    campaign = null
  }

  return {
    get campaign() { return campaign },
    get loading() { return loading },
    get hasSchedule() { return hasSchedule },
    get isRunning() { return isRunning },
    loadCampaign,
    clear
  }
}

export const campaignDetailStore = createCampaignDetailStore()
```

**Step 3: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/services/campaignDetailService.ts src/lib/stores/campaignDetailStore.svelte.ts
git commit -m "feat: add campaign detail service and store"
```

---

### Task 4: Create CampaignContextPanel and modify application layout

Build the campaign-level sidebar and update the parent layout to conditionally swap panels.

**Files:**
- Create: `src/lib/components/layout/CampaignContextPanel.svelte`
- Modify: `src/routes/applications/[id]/+layout.svelte`

**Step 1: Create CampaignContextPanel.svelte**

This component mirrors the structure of `ApplicationContextPanel.svelte` (see `src/lib/components/layout/ApplicationContextPanel.svelte` for reference). It has a back link, same app selector dropdown, Create Campaign button, and campaign-level nav items.

```svelte
<!-- src/lib/components/layout/CampaignContextPanel.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation'
  import {
    LayoutDashboard,
    GitBranch,
    Ticket,
    BarChart3,
    Settings,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Plus
  } from 'lucide-svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { campaignDetailStore } from '$lib/stores/campaignDetailStore.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import type { Environment } from '$lib/types'

  let {
    applicationId,
    applicationName,
    environment,
    campaignId,
    currentPath
  }: {
    applicationId: string
    applicationName: string
    environment: Environment
    campaignId: string
    currentPath: string
  } = $props()

  let showAppDropdown = $state(false)

  const basePath = $derived(`/applications/${applicationId}/campaigns/${campaignId}`)

  const navItems = $derived([
    { label: 'Dashboard', icon: LayoutDashboard, href: `${basePath}/dashboard` },
    { label: 'Rule Builder', icon: GitBranch, href: `${basePath}/rule-builder` },
    { label: 'Coupons', icon: Ticket, href: `${basePath}/coupons` },
    { label: 'Insights', icon: BarChart3, href: `${basePath}/insights` },
    { label: 'Settings', icon: Settings, href: `${basePath}/settings`, hasChevron: true }
  ])

  function isActive(href: string): boolean {
    return currentPath === href || currentPath.startsWith(href + '/')
  }

  function selectApp(id: string) {
    showAppDropdown = false
    goto(`/applications/${id}`)
  }

  function handleWindowClick() {
    showAppDropdown = false
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="flex h-full flex-col p-4">
  <!-- Back to Application -->
  <a
    href="/applications/{applicationId}/campaigns"
    class="flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
  >
    <ChevronLeft size={16} />
    To Application
  </a>

  <!-- Application Selector -->
  <div class="mt-4">
    <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      Select Application
    </span>
    <div class="relative mt-1">
      <button
        class="flex w-full items-center justify-between rounded-lg border border-border bg-panel px-3 py-2 text-left text-sm"
        onclick={(e: MouseEvent) => { e.stopPropagation(); showAppDropdown = !showAppDropdown }}
      >
        <div>
          <div class="font-semibold text-ink">{applicationName}</div>
          <div class="mt-0.5">
            <Badge
              variant={environment === 'live' ? 'live' : 'sandbox'}
              label={environment === 'live' ? 'LIVE' : 'SANDBOX'}
            />
          </div>
        </div>
        <ChevronDown size={16} class="text-gray-400" />
      </button>

      {#if showAppDropdown}
        <div
          class="absolute z-10 mt-1 w-full rounded-lg border border-border bg-panel py-1 shadow-card"
          role="menu"
          tabindex="-1"
          onclick={(e: MouseEvent) => e.stopPropagation()}
          onkeydown={(e: KeyboardEvent) => { if (e.key === 'Escape') showAppDropdown = false }}
        >
          {#each applicationStore.applications as app (app.id)}
            <button
              class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 {
                applicationId === app.id ? 'bg-blue-50 text-primary' : 'text-ink'
              }"
              onclick={() => selectApp(app.id)}
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

  <!-- Create Campaign CTA -->
  <button
    class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
  >
    <Plus size={16} />
    Create Campaign
  </button>

  <!-- MANAGE CAMPAIGN -->
  <div class="mt-6">
    <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      Manage Campaign
    </span>
    <nav class="mt-2 flex flex-col gap-0.5">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors {
            isActive(item.href)
              ? 'border-l-2 border-primary bg-blue-50 text-primary'
              : 'border-l-2 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }"
        >
          <div class="flex items-center gap-2.5">
            <item.icon size={16} />
            {item.label}
          </div>
          {#if item.hasChevron}
            <ChevronRight size={14} class="text-gray-400" />
          {/if}
        </a>
      {/each}
    </nav>
  </div>
</div>
```

**Step 2: Modify the application layout to conditionally swap panels**

In `src/routes/applications/[id]/+layout.svelte`, detect when the URL matches a campaign detail path and render `CampaignContextPanel` instead of `ApplicationContextPanel`.

Replace the entire content of `src/routes/applications/[id]/+layout.svelte` with:

```svelte
<script lang="ts">
  import { page } from '$app/state'
  import { onMount } from 'svelte'
  import IconRail from '$lib/components/layout/IconRail.svelte'
  import ApplicationContextPanel from '$lib/components/layout/ApplicationContextPanel.svelte'
  import CampaignContextPanel from '$lib/components/layout/CampaignContextPanel.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'

  let { children } = $props()

  const appId = $derived(page.params.id ?? '')
  const campaignId = $derived(page.params.campaignId ?? '')
  const currentPath = $derived(page.url.pathname)
  const inCampaignDetail = $derived(campaignId !== '')

  onMount(() => {
    applicationStore.loadApplications()
  })

  $effect(() => {
    if (appId) {
      applicationStore.selectApplication(appId)
    }
  })
</script>

<div class="grid h-screen grid-cols-[56px_220px_1fr]">
  <IconRail {currentPath} />

  <aside class="overflow-y-auto border-r border-border bg-panel">
    {#if inCampaignDetail}
      <CampaignContextPanel
        applicationId={appId}
        applicationName={applicationStore.selectedApplication?.name ?? ''}
        environment={applicationStore.selectedApplication?.environment ?? 'live'}
        {campaignId}
        {currentPath}
      />
    {:else}
      <ApplicationContextPanel
        applicationId={appId}
        applicationName={applicationStore.selectedApplication?.name ?? ''}
        environment={applicationStore.selectedApplication?.environment ?? 'live'}
        {currentPath}
      />
    {/if}
  </aside>

  <main class="overflow-y-auto bg-surface">
    {@render children()}
  </main>
</div>
```

**Step 3: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/components/layout/CampaignContextPanel.svelte src/routes/applications/\[id\]/+layout.svelte
git commit -m "feat: add CampaignContextPanel and conditional sidebar swap in app layout"
```

---

### Task 5: Create campaign detail route structure

Create the nested route files: layout, index redirect, and placeholder pages.

**Files:**
- Create: `src/routes/applications/[id]/campaigns/[campaignId]/+layout.svelte`
- Create: `src/routes/applications/[id]/campaigns/[campaignId]/+layout.ts`
- Create: `src/routes/applications/[id]/campaigns/[campaignId]/+page.svelte`
- Create: `src/routes/applications/[id]/campaigns/[campaignId]/rule-builder/+page.svelte`
- Create: `src/routes/applications/[id]/campaigns/[campaignId]/coupons/+page.svelte`
- Create: `src/routes/applications/[id]/campaigns/[campaignId]/insights/+page.svelte`
- Create: `src/routes/applications/[id]/campaigns/[campaignId]/settings/+page.svelte`

**Step 1: Create +layout.ts**

```typescript
// src/routes/applications/[id]/campaigns/[campaignId]/+layout.ts
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = ({ params }) => {
  return { campaignId: params.campaignId }
}
```

**Step 2: Create +layout.svelte**

This layout loads the campaign detail data when the campaignId changes.

```svelte
<!-- src/routes/applications/[id]/campaigns/[campaignId]/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/state'
  import { campaignDetailStore } from '$lib/stores/campaignDetailStore.svelte'

  let { children } = $props()

  const campaignId = $derived(page.params.campaignId ?? '')

  $effect(() => {
    if (campaignId) {
      campaignDetailStore.loadCampaign(campaignId)
    }
    return () => {
      campaignDetailStore.clear()
    }
  })
</script>

{@render children()}
```

**Step 3: Create +page.svelte (redirect to dashboard)**

```svelte
<!-- src/routes/applications/[id]/campaigns/[campaignId]/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'

  const appId = $derived(page.params.id)
  const campaignId = $derived(page.params.campaignId)

  $effect(() => {
    if (appId && campaignId) {
      goto(`/applications/${appId}/campaigns/${campaignId}/dashboard`, { replaceState: true })
    }
  })
</script>
```

**Step 4: Create placeholder pages**

Create four placeholder pages, each following the same pattern as existing placeholders (see `src/routes/applications/[id]/stores/+page.svelte`).

`src/routes/applications/[id]/campaigns/[campaignId]/rule-builder/+page.svelte`:

```svelte
<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { campaignDetailStore } from '$lib/stores/campaignDetailStore.svelte'
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte'

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')
  const campaignName = $derived(campaignDetailStore.campaign?.name ?? 'Campaign')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: campaignName, href: `/applications/${appId}/campaigns/${page.params.campaignId}/dashboard` },
    { label: 'Rule Builder' }
  ])
</script>

<div class="p-6">
  <Breadcrumb items={breadcrumbItems} />

  <div class="mt-12 flex flex-col items-center justify-center text-center">
    <h2 class="text-lg font-semibold text-ink">Rule Builder</h2>
    <p class="mt-2 text-sm text-gray-500">This section is coming soon.</p>
  </div>
</div>
```

`src/routes/applications/[id]/campaigns/[campaignId]/coupons/+page.svelte`:

```svelte
<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { campaignDetailStore } from '$lib/stores/campaignDetailStore.svelte'
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte'

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')
  const campaignName = $derived(campaignDetailStore.campaign?.name ?? 'Campaign')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: campaignName, href: `/applications/${appId}/campaigns/${page.params.campaignId}/dashboard` },
    { label: 'Coupons' }
  ])
</script>

<div class="p-6">
  <Breadcrumb items={breadcrumbItems} />

  <div class="mt-12 flex flex-col items-center justify-center text-center">
    <h2 class="text-lg font-semibold text-ink">Coupons</h2>
    <p class="mt-2 text-sm text-gray-500">This section is coming soon.</p>
  </div>
</div>
```

`src/routes/applications/[id]/campaigns/[campaignId]/insights/+page.svelte`:

```svelte
<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { campaignDetailStore } from '$lib/stores/campaignDetailStore.svelte'
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte'

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')
  const campaignName = $derived(campaignDetailStore.campaign?.name ?? 'Campaign')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: campaignName, href: `/applications/${appId}/campaigns/${page.params.campaignId}/dashboard` },
    { label: 'Insights' }
  ])
</script>

<div class="p-6">
  <Breadcrumb items={breadcrumbItems} />

  <div class="mt-12 flex flex-col items-center justify-center text-center">
    <h2 class="text-lg font-semibold text-ink">Insights</h2>
    <p class="mt-2 text-sm text-gray-500">This section is coming soon.</p>
  </div>
</div>
```

`src/routes/applications/[id]/campaigns/[campaignId]/settings/+page.svelte`:

```svelte
<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { campaignDetailStore } from '$lib/stores/campaignDetailStore.svelte'
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte'

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')
  const campaignName = $derived(campaignDetailStore.campaign?.name ?? 'Campaign')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: campaignName, href: `/applications/${appId}/campaigns/${page.params.campaignId}/dashboard` },
    { label: 'Settings' }
  ])
</script>

<div class="p-6">
  <Breadcrumb items={breadcrumbItems} />

  <div class="mt-12 flex flex-col items-center justify-center text-center">
    <h2 class="text-lg font-semibold text-ink">Settings</h2>
    <p class="mt-2 text-sm text-gray-500">This section is coming soon.</p>
  </div>
</div>
```

**Step 5: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 6: Commit**

```bash
git add src/routes/applications/\[id\]/campaigns/\[campaignId\]/
git commit -m "feat: add campaign detail route structure with layout, redirect, and placeholder pages"
```

---

### Task 6: Create campaign dashboard card components

Build the 5 card components and the activation banner for the campaign dashboard.

**Files:**
- Create: `src/lib/components/campaigns/CampaignActivationBanner.svelte`
- Create: `src/lib/components/campaigns/CampaignDetailsCard.svelte`
- Create: `src/lib/components/campaigns/CampaignStateCard.svelte`
- Create: `src/lib/components/campaigns/CampaignScheduleCard.svelte`
- Create: `src/lib/components/campaigns/CampaignRulesCard.svelte`
- Create: `src/lib/components/campaigns/CampaignBudgetsCard.svelte`

**Step 1: Create CampaignActivationBanner.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignActivationBanner.svelte -->
<script lang="ts">
  import { X, Calendar, Ticket } from 'lucide-svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  let showBanner = $state(true)
  let showScheduleCard = $state(true)
  let showCouponsCard = $state(true)

  const hasCards = $derived(showScheduleCard || showCouponsCard)
</script>

{#if showBanner && hasCards}
  <div class="rounded-lg border border-blue-200 bg-blue-50/50 p-4 {className}">
    <div class="flex items-start justify-between">
      <h3 class="text-sm font-semibold text-ink">
        Consider the following steps before activating your campaign
      </h3>
      <button
        class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        onclick={() => showBanner = false}
      >
        <X size={16} />
      </button>
    </div>

    <div class="mt-3 flex gap-3">
      {#if showScheduleCard}
        <div class="relative flex-1 rounded-lg border border-border bg-panel p-4">
          <button
            class="absolute right-2 top-2 rounded-lg p-0.5 text-gray-400 hover:text-gray-600"
            onclick={() => showScheduleCard = false}
          >
            <X size={14} />
          </button>
          <div class="flex items-start gap-3">
            <Calendar size={20} class="mt-0.5 text-primary" />
            <div>
              <p class="text-sm font-semibold text-primary">Set a Schedule</p>
              <p class="mt-1 text-xs text-gray-500">Automate the start and end of your campaign.</p>
            </div>
          </div>
        </div>
      {/if}

      {#if showCouponsCard}
        <div class="relative flex-1 rounded-lg border border-border bg-panel p-4">
          <button
            class="absolute right-2 top-2 rounded-lg p-0.5 text-gray-400 hover:text-gray-600"
            onclick={() => showCouponsCard = false}
          >
            <X size={14} />
          </button>
          <div class="flex items-start gap-3">
            <Ticket size={20} class="mt-0.5 text-primary" />
            <div>
              <p class="text-sm font-semibold text-primary">Create Coupons</p>
              <p class="mt-1 text-xs text-gray-500">Generate and modify your coupon codes.</p>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
```

**Step 2: Create CampaignDetailsCard.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignDetailsCard.svelte -->
<script lang="ts">
  import { Settings } from 'lucide-svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import type { CampaignDetail } from '$lib/types'

  let {
    campaign,
    class: className = ''
  }: {
    campaign: CampaignDetail
    class?: string
  } = $props()

  const lastUpdatedDate = $derived(
    new Date(campaign.lastUpdatedAt).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  )
</script>

<Card class={className}>
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-semibold text-ink">Details</h3>
    <button class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
      <Settings size={16} />
    </button>
  </div>

  <div class="mt-3 space-y-1 text-sm text-gray-600">
    <p>{campaign.description}</p>
    <p>{campaign.category}</p>
    <p>{campaign.productList}</p>
  </div>

  <button class="mt-2 text-sm text-primary hover:underline">Go to Details</button>

  <hr class="my-4 border-border" />

  <div class="flex items-center justify-between">
    <h3 class="text-sm font-semibold text-ink">Tags</h3>
    <button class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
      <Settings size={16} />
    </button>
  </div>

  {#if campaign.tags.length > 0}
    <div class="mt-2 flex flex-wrap gap-1.5">
      {#each campaign.tags as tag}
        <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{tag}</span>
      {/each}
    </div>
  {:else}
    <div class="mt-2 text-sm text-gray-500">
      <p class="font-medium">No tags yet.</p>
      <p class="mt-1 text-xs">To add tags, open <button class="text-primary hover:underline">Details</button>. To generate them automatically, click ✨ Autofill.</p>
    </div>
  {/if}

  <p class="mt-4 text-xs text-gray-400">
    Last updated on {lastUpdatedDate} by {campaign.lastUpdatedBy}
  </p>
</Card>
```

**Step 3: Create CampaignStateCard.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignStateCard.svelte -->
<script lang="ts">
  import { MoreVertical } from 'lucide-svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import type { CampaignStatus } from '$lib/types'

  let {
    status,
    class: className = ''
  }: {
    status: CampaignStatus
    class?: string
  } = $props()

  const statusConfig: Record<string, { label: string; dotColor: string; description: string }> = {
    scheduled: {
      label: 'Scheduled',
      dotColor: 'bg-blue-500',
      description: 'The campaign is scheduled to start. Rules will be validated.'
    },
    running: {
      label: 'Running',
      dotColor: 'bg-green-500',
      description: 'The campaign is currently running. Rules will be validated.'
    },
    expired: {
      label: 'Expired',
      dotColor: 'bg-red-500',
      description: 'The campaign has expired and is no longer active.'
    },
    disabled: {
      label: 'Disabled',
      dotColor: 'bg-gray-400',
      description: 'The campaign is disabled and will not process any rules.'
    }
  }

  const config = $derived(statusConfig[status])
</script>

<Card class={className}>
  <h3 class="text-sm font-semibold text-ink">State</h3>

  <div class="mt-3 flex items-center gap-2">
    <span class="h-2.5 w-2.5 rounded-full {config.dotColor}"></span>
    <span class="text-sm font-semibold text-ink">{config.label}</span>
  </div>

  <p class="mt-2 text-sm text-gray-500">{config.description}</p>

  <div class="mt-4 flex items-center gap-2">
    <Button variant="secondary" size="sm">Disable Campaign</Button>
    <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
      <MoreVertical size={16} />
    </button>
  </div>
</Card>
```

**Step 4: Create CampaignScheduleCard.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignScheduleCard.svelte -->
<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte'
  import { formatDate } from '$lib/utils'

  let {
    schedule,
    class: className = ''
  }: {
    schedule: { startDate: string | null; endDate: string | null }
    class?: string
  } = $props()

  const hasSchedule = $derived(schedule.startDate !== null || schedule.endDate !== null)
</script>

<Card class={className}>
  <h3 class="text-sm font-semibold text-ink">Schedule</h3>

  {#if hasSchedule}
    <div class="mt-3 space-y-1 text-sm text-gray-600">
      {#if schedule.startDate}
        <p>Start: {formatDate(schedule.startDate)}</p>
      {/if}
      {#if schedule.endDate}
        <p>End: {formatDate(schedule.endDate)}</p>
      {/if}
    </div>
  {:else}
    <p class="mt-3 text-sm font-medium text-gray-600">No time limit</p>
    <p class="mt-1 text-sm text-gray-500">The campaign has no schedule. If running, it will run with no time limit.</p>
  {/if}

  <button class="mt-3 text-sm text-primary hover:underline">Go to Schedule</button>
</Card>
```

**Step 5: Create CampaignRulesCard.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignRulesCard.svelte -->
<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte'
  import type { CampaignRule } from '$lib/types'

  let {
    rules,
    class: className = ''
  }: {
    rules: CampaignRule[]
    class?: string
  } = $props()
</script>

<Card class={className}>
  <h3 class="text-sm font-semibold text-ink">Rules</h3>

  {#if rules.length > 0}
    <p class="mt-2 text-sm text-gray-500">The campaign contains the following rules:</p>

    <div class="mt-3 space-y-3">
      {#each rules as rule}
        <div>
          <p class="text-sm font-medium text-ink">{rule.name}</p>
          <p class="text-xs text-gray-400">
            Defined by {rule.conditions} condition{rule.conditions !== 1 ? 's' : ''} and {rule.effects} effect{rule.effects !== 1 ? 's' : ''}
          </p>
        </div>
      {/each}
    </div>
  {:else}
    <p class="mt-2 text-sm text-gray-500">No rules defined yet.</p>
  {/if}

  <button class="mt-4 text-sm text-primary hover:underline">Go to the Rule Builder</button>
</Card>
```

**Step 6: Create CampaignBudgetsCard.svelte**

```svelte
<!-- src/lib/components/campaigns/CampaignBudgetsCard.svelte -->
<script lang="ts">
  import { BarChart3 } from 'lucide-svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import type { CampaignBudget } from '$lib/types'
  import { formatNumber } from '$lib/utils'

  let {
    budgets,
    class: className = ''
  }: {
    budgets: CampaignBudget[]
    class?: string
  } = $props()
</script>

<Card class={className}>
  <h3 class="text-sm font-semibold text-ink">Performance and Budgets</h3>

  <div class="mt-3 flex items-center gap-2 text-sm text-gray-600">
    <BarChart3 size={16} />
    <span class="font-medium">Campaign Budgets</span>
  </div>

  <div class="mt-3 space-y-4">
    {#each budgets as budget}
      <div>
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="text-gray-600">{budget.label}</span>
            <span class="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
              {budget.recurrence ?? 'no recurrence'}
            </span>
          </div>
          <span class="font-mono text-gray-500">
            {formatNumber(budget.current)}/{formatNumber(budget.limit)}
          </span>
        </div>
        <div class="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
          <div
            class="h-1.5 rounded-full bg-primary"
            style="width: {Math.min((budget.current / budget.limit) * 100, 100)}%"
          ></div>
        </div>
      </div>
    {/each}
  </div>

  <div class="mt-4 space-y-1 text-sm text-gray-500">
    <p>View your campaign performance in the <button class="text-primary hover:underline">insights</button> section.</p>
    <p>View and create coupons in the <button class="text-primary hover:underline">coupons</button> section.</p>
  </div>

  <button class="mt-3 text-sm text-primary hover:underline">Go to Budgets</button>
</Card>
```

**Step 7: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 8: Commit**

```bash
git add src/lib/components/campaigns/CampaignActivationBanner.svelte src/lib/components/campaigns/CampaignDetailsCard.svelte src/lib/components/campaigns/CampaignStateCard.svelte src/lib/components/campaigns/CampaignScheduleCard.svelte src/lib/components/campaigns/CampaignRulesCard.svelte src/lib/components/campaigns/CampaignBudgetsCard.svelte
git commit -m "feat: add campaign dashboard card components and activation banner"
```

---

### Task 7: Wire up the campaign dashboard page

**Files:**
- Create: `src/routes/applications/[id]/campaigns/[campaignId]/dashboard/+page.svelte`

**Step 1: Create the dashboard page**

```svelte
<!-- src/routes/applications/[id]/campaigns/[campaignId]/dashboard/+page.svelte -->
<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { campaignDetailStore } from '$lib/stores/campaignDetailStore.svelte'
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte'
  import CampaignActivationBanner from '$lib/components/campaigns/CampaignActivationBanner.svelte'
  import CampaignDetailsCard from '$lib/components/campaigns/CampaignDetailsCard.svelte'
  import CampaignStateCard from '$lib/components/campaigns/CampaignStateCard.svelte'
  import CampaignScheduleCard from '$lib/components/campaigns/CampaignScheduleCard.svelte'
  import CampaignRulesCard from '$lib/components/campaigns/CampaignRulesCard.svelte'
  import CampaignBudgetsCard from '$lib/components/campaigns/CampaignBudgetsCard.svelte'

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')
  const campaign = $derived(campaignDetailStore.campaign)

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: campaign?.name ?? 'Campaign' }
  ])
</script>

<div class="p-6">
  <Breadcrumb items={breadcrumbItems} />

  {#if campaign}
    <CampaignActivationBanner class="mt-6" />

    <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Left column -->
      <div class="space-y-6">
        <CampaignDetailsCard {campaign} />
        <CampaignRulesCard rules={campaign.rules} />
      </div>

      <!-- Right column -->
      <div class="space-y-6">
        <CampaignStateCard status={campaign.status} />
        <CampaignScheduleCard schedule={campaign.schedule} />
        <CampaignBudgetsCard budgets={campaign.budgets} />
      </div>
    </div>
  {:else if campaignDetailStore.loading}
    <div class="mt-12 flex justify-center">
      <p class="text-sm text-gray-400">Loading campaign...</p>
    </div>
  {:else}
    <div class="mt-12 flex flex-col items-center justify-center text-center">
      <h2 class="text-lg font-semibold text-ink">Campaign not found</h2>
      <p class="mt-2 text-sm text-gray-500">The requested campaign could not be loaded.</p>
    </div>
  {/if}
</div>
```

**Step 2: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/routes/applications/\[id\]/campaigns/\[campaignId\]/dashboard/+page.svelte
git commit -m "feat: implement campaign dashboard page with all card components"
```

---

### Task 8: Make campaign name clickable in list table

**Files:**
- Modify: `src/lib/components/campaigns/CampaignTableRow.svelte`

**Step 1: Update the campaign name cell**

In `src/lib/components/campaigns/CampaignTableRow.svelte`, change the first `<td>` from plain text to a link.

Find:

```svelte
  <td class="whitespace-nowrap px-3 py-3 text-sm font-medium text-ink">
    {campaign.name}
  </td>
```

Replace with:

```svelte
  <td class="whitespace-nowrap px-3 py-3 text-sm font-medium">
    <a
      href="/applications/{campaign.applicationId}/campaigns/{campaign.id}/dashboard"
      class="text-ink hover:text-primary hover:underline"
    >
      {campaign.name}
    </a>
  </td>
```

**Step 2: Verify types compile**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/components/campaigns/CampaignTableRow.svelte
git commit -m "feat: make campaign name a clickable link to campaign detail"
```

---

### Task 9: Final verification

**Step 1: Type check**

Run: `bun run check`
Expected: No errors

**Step 2: Production build**

Run: `bun run build`
Expected: Build succeeds with no errors

**Step 3: Manual verification checklist**

Start dev server with `bun run dev` and verify:

1. Navigate to `/applications/app-1/campaigns`
2. **Campaign name is a link** — hover shows underline, cursor changes
3. Click a campaign name (e.g. "New User Welcome Voucher" cl-006)
4. **URL** changes to `/applications/app-1/campaigns/cl-006/dashboard`
5. **Sidebar swaps** — "< To Application" back link visible, "MANAGE CAMPAIGN" section with Dashboard/Rule Builder/Coupons/Insights/Settings
6. **Dashboard nav item** is highlighted (blue)
7. **Breadcrumb** shows: Apps > KSA Production > New User Welcome Voucher
8. **Activation banner** visible with "Set a Schedule" and "Create Coupons" cards. Click X on one card → it dismisses. Click banner X → entire banner dismisses.
9. **Details card** — shows description, category, product list, tags, last updated
10. **State card** — shows "Running" with green dot, "Disable Campaign" button (no-op)
11. **Schedule card** — shows dates or "No time limit" (try cl-008 for no schedule)
12. **Rules card** — lists rules with condition/effect counts
13. **Budgets card** — shows budget bars with progress
14. **Sidebar nav** — click "Rule Builder" → placeholder page loads, breadcrumb updates
15. **Back link** — click "< To Application" → returns to campaign list, sidebar swaps back to application nav
16. **App selector** — dropdown works in campaign context

**Step 4: Fix any issues found and commit**

---

## File Summary

### New files (18)
- `src/lib/types/campaign.ts` (modified — extended with detail types)
- `src/lib/mocks/campaignDetail.ts`
- `src/lib/services/campaignDetailService.ts`
- `src/lib/stores/campaignDetailStore.svelte.ts`
- `src/lib/components/layout/CampaignContextPanel.svelte`
- `src/lib/components/campaigns/CampaignActivationBanner.svelte`
- `src/lib/components/campaigns/CampaignDetailsCard.svelte`
- `src/lib/components/campaigns/CampaignStateCard.svelte`
- `src/lib/components/campaigns/CampaignScheduleCard.svelte`
- `src/lib/components/campaigns/CampaignRulesCard.svelte`
- `src/lib/components/campaigns/CampaignBudgetsCard.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/+layout.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/+layout.ts`
- `src/routes/applications/[id]/campaigns/[campaignId]/+page.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/dashboard/+page.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/rule-builder/+page.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/coupons/+page.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/insights/+page.svelte`
- `src/routes/applications/[id]/campaigns/[campaignId]/settings/+page.svelte`

### Modified files (2)
- `src/routes/applications/[id]/+layout.svelte` (conditional sidebar swap)
- `src/lib/components/campaigns/CampaignTableRow.svelte` (name → link)
