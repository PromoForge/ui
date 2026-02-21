# Application Dashboard Views — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the `/applications/[id]` section with a three-zone layout featuring an ApplicationContextPanel (Zone B) and two switchable dashboard views (Revenue Overview + Metrics Dashboard).

**Architecture:** Use SvelteKit layout groups to have different sidebar layouts for the home section (`/`, `/settings`) vs. the application detail section (`/applications/[id]/*`). The root layout becomes minimal (CSS only), `(app)/+layout.svelte` wraps home pages in the existing AppShell with ApplicationPanel (380px), and `applications/[id]/+layout.svelte` provides its own three-column grid with ApplicationContextPanel (220px).

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Tailwind CSS v4, TypeScript, Lucide Svelte icons, LayerChart

**Design doc:** `docs/plans/2026-02-22-application-dashboard-views-design.md`

---

### Task 1: Create shared UI components (Breadcrumb, InfoBanner, PageActions)

These are additive — no existing code changes. They'll be used by both View 1 and View 2.

**Files:**
- Create: `src/lib/components/ui/Breadcrumb.svelte`
- Create: `src/lib/components/ui/InfoBanner.svelte`
- Create: `src/lib/components/ui/PageActions.svelte`

**Step 1: Create Breadcrumb.svelte**

```svelte
<!-- src/lib/components/ui/Breadcrumb.svelte -->
<script lang="ts">
  import { ChevronRight } from 'lucide-svelte'

  let { items, class: className = '' }: {
    items: Array<{ label: string; href?: string }>
    class?: string
  } = $props()
</script>

<nav class="flex items-center gap-1 text-sm text-gray-500 {className}">
  {#each items as item, i}
    {#if i > 0}
      <ChevronRight size={14} class="text-gray-400" />
    {/if}
    {#if item.href}
      <a href={item.href} class="hover:text-primary">{item.label}</a>
    {:else}
      <span class="font-medium text-ink">{item.label}</span>
    {/if}
  {/each}
</nav>
```

**Step 2: Create InfoBanner.svelte**

```svelte
<!-- src/lib/components/ui/InfoBanner.svelte -->
<script lang="ts">
  import { Info, X } from 'lucide-svelte'

  let { message, class: className = '' }: {
    message: string
    class?: string
  } = $props()

  let visible = $state(true)
</script>

{#if visible}
  <div class="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 {className}">
    <div class="flex items-center gap-2">
      <Info size={16} />
      <span>{message}</span>
    </div>
    <button onclick={() => visible = false} class="text-blue-400 hover:text-blue-600">
      <X size={16} />
    </button>
  </div>
{/if}
```

**Step 3: Create PageActions.svelte**

```svelte
<!-- src/lib/components/ui/PageActions.svelte -->
<script lang="ts">
  import { ExternalLink, ChevronDown } from 'lucide-svelte'
</script>

<div class="flex items-center gap-2">
  <button class="flex items-center gap-1.5 text-sm text-primary hover:underline">
    <ExternalLink size={14} />
    Documentation
  </button>
  <button class="flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-2 text-sm text-ink">
    Manage Campaign Data
    <ChevronDown size={14} class="text-gray-400" />
  </button>
</div>
```

**Step 4: Verify types**

Run: `bun run check`
Expected: No errors

**Step 5: Commit**

```bash
git add src/lib/components/ui/Breadcrumb.svelte src/lib/components/ui/InfoBanner.svelte src/lib/components/ui/PageActions.svelte
git commit -m "feat: add shared Breadcrumb, InfoBanner, and PageActions components"
```

---

### Task 2: Create ApplicationContextPanel component

The new Zone B sidebar for the application detail section. Additive — no existing code changes.

**Files:**
- Create: `src/lib/components/layout/ApplicationContextPanel.svelte`

**Step 1: Create ApplicationContextPanel.svelte**

```svelte
<!-- src/lib/components/layout/ApplicationContextPanel.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation'
  import {
    LayoutDashboard,
    Megaphone,
    BarChart3,
    Bell,
    Store,
    Filter,
    Users,
    Activity,
    Zap,
    Search,
    Settings,
    ChevronDown,
    ChevronRight,
    Plus
  } from 'lucide-svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import type { Environment } from '$lib/types'

  let {
    applicationId,
    applicationName,
    environment,
    currentPath
  }: {
    applicationId: string
    applicationName: string
    environment: Environment
    currentPath: string
  } = $props()

  let showAppDropdown = $state(false)

  const manageItems = $derived([
    { label: 'Dashboard', icon: LayoutDashboard, href: `/applications/${applicationId}/dashboard` },
    { label: 'Campaigns', icon: Megaphone, href: `/applications/${applicationId}/campaigns` },
    { label: 'Campaign Evaluation', icon: BarChart3, href: `/applications/${applicationId}/campaign-evaluation` },
    { label: 'Notifications', icon: Bell, href: `/applications/${applicationId}/notifications` },
    { label: 'Stores', icon: Store, href: `/applications/${applicationId}/stores` },
    { label: 'Cart Item Filters', icon: Filter, href: `/applications/${applicationId}/cart-item-filters` }
  ])

  const activityItems = $derived([
    { label: 'Customers', icon: Users, href: `/applications/${applicationId}/customers` },
    { label: 'Sessions', icon: Activity, href: `/applications/${applicationId}/sessions` },
    { label: 'Events', icon: Zap, href: `/applications/${applicationId}/events` },
    { label: 'Coupon Finder', icon: Search, href: `/applications/${applicationId}/coupon-finder` },
    { label: 'Settings', icon: Settings, href: `/applications/${applicationId}/settings-app`, hasChevron: true }
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
  <!-- Application Selector -->
  <div>
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

  <!-- MANAGE APPLICATION -->
  <div class="mt-6">
    <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      Manage Application
    </span>
    <nav class="mt-2 flex flex-col gap-0.5">
      {#each manageItems as item}
        <a
          href={item.href}
          class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors {
            isActive(item.href)
              ? 'border-l-2 border-primary bg-blue-50 text-primary'
              : 'border-l-2 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }"
        >
          <item.icon size={16} />
          {item.label}
        </a>
      {/each}
    </nav>
  </div>

  <!-- ACTIVITY AND SUPPORT -->
  <div class="mt-6">
    <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      Activity and Support
    </span>
    <nav class="mt-2 flex flex-col gap-0.5">
      {#each activityItems as item}
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

**Step 2: Verify types**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/components/layout/ApplicationContextPanel.svelte
git commit -m "feat: add ApplicationContextPanel layout component for Zone B"
```

---

### Task 3: Restructure routes with layout groups

Move existing pages into an `(app)` layout group so the home section and application detail section can have different layouts. The root layout becomes minimal.

**Files:**
- Modify: `src/routes/+layout.svelte` (make minimal)
- Create: `src/routes/(app)/+layout.svelte` (current AppShell wrapping)
- Move: `src/routes/+page.svelte` → `src/routes/(app)/+page.svelte`
- Move: `src/routes/settings/+page.svelte` → `src/routes/(app)/settings/+page.svelte`

**Step 1: Create the (app) layout group layout**

Create `src/routes/(app)/+layout.svelte` with the current root layout content:

```svelte
<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
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

**Step 2: Simplify the root layout**

Edit `src/routes/+layout.svelte` to be minimal:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css'

  let { children } = $props()
</script>

{@render children()}
```

**Step 3: Move pages into (app) group**

Using bash commands (these are file moves, not content changes):

```bash
# Create directories
mkdir -p src/routes/\(app\)/settings

# Move the home page
mv src/routes/+page.svelte src/routes/\(app\)/+page.svelte

# Move the settings page
mv src/routes/settings/+page.svelte src/routes/\(app\)/settings/+page.svelte

# Remove empty settings directory
rmdir src/routes/settings
```

**Step 4: Verify dev server works**

Run: `bun run check`
Expected: No errors

Verify manually: Open `http://localhost:5173` — should see the same dashboard as before. The `(app)` group doesn't change URLs.

**Step 5: Commit**

```bash
git add src/routes/+layout.svelte src/routes/\(app\)/ -A
git commit -m "refactor: restructure routes with (app) layout group for separate sidebar layouts"
```

---

### Task 4: Create the application detail layout and View 1 (Revenue Overview)

Create the nested layout for `/applications/[id]` that renders IconRail + ApplicationContextPanel + child content. Then create View 1 as the default page.

**Files:**
- Create: `src/routes/applications/[id]/+layout.svelte`
- Create: `src/routes/applications/[id]/+layout.ts`
- Replace: `src/routes/applications/[id]/+page.svelte` (was Metrics Dashboard, now becomes Revenue Overview)

**Step 1: Create the layout load function**

```typescript
// src/routes/applications/[id]/+layout.ts
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = ({ params }) => {
  return { applicationId: params.id }
}
```

**Step 2: Create the nested layout**

```svelte
<!-- src/routes/applications/[id]/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/state'
  import { onMount } from 'svelte'
  import IconRail from '$lib/components/layout/IconRail.svelte'
  import ApplicationContextPanel from '$lib/components/layout/ApplicationContextPanel.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'

  let { children } = $props()

  const appId = $derived(page.params.id)
  const currentPath = $derived(page.url.pathname)

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
  <IconRail activeHref="/" />

  <aside class="overflow-y-auto border-r border-border bg-panel">
    <ApplicationContextPanel
      applicationId={appId}
      applicationName={applicationStore.selectedApplication?.name ?? ''}
      environment={applicationStore.selectedApplication?.environment ?? 'live'}
      {currentPath}
    />
  </aside>

  <main class="overflow-y-auto bg-surface">
    {@render children()}
  </main>
</div>
```

**Step 3: Create View 1 (Revenue Overview) — replace existing +page.svelte**

The existing `src/routes/applications/[id]/+page.svelte` currently shows the Metrics Dashboard (metric cards). We're replacing it with the Revenue Overview. The Metrics Dashboard will move to `dashboard/+page.svelte` in Task 5.

First, **save the existing file content** — you'll need it for Task 5. Copy the content of `src/routes/applications/[id]/+page.svelte` somewhere temporary before replacing.

Then write the new Revenue Overview page:

```svelte
<!-- src/routes/applications/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { ChevronDown } from 'lucide-svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { dashboardStore } from '$lib/stores/dashboardStore.svelte'
  import StatCard from '$lib/components/ui/StatCard.svelte'
  import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte'
  import InfoBanner from '$lib/components/ui/InfoBanner.svelte'
  import PageActions from '$lib/components/ui/PageActions.svelte'
  import RevenueChart from '$lib/components/dashboard/RevenueChart.svelte'
  import PastWeekCard from '$lib/components/dashboard/PastWeekCard.svelte'
  import RevenueSummaryTable from '$lib/components/dashboard/RevenueSummaryTable.svelte'
  import type { TimeRange } from '$lib/types'

  let showAppDropdown = $state(false)

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: 'Overview' }
  ])

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

  $effect(() => {
    if (appId) {
      dashboardStore.loadDashboard(appId)
    }
  })

  function handleTimeRangeChange(value: string) {
    dashboardStore.setTimeRange(value as TimeRange)
    if (appId) {
      dashboardStore.loadDashboard(appId)
    }
  }

  function selectAppFromDropdown(id: string) {
    showAppDropdown = false
    goto(`/applications/${id}`)
  }

  function handleWindowClick() {
    showAppDropdown = false
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="p-6">
  <!-- Breadcrumb + Actions -->
  <div class="flex items-center justify-between">
    <Breadcrumb items={breadcrumbItems} />
    <PageActions />
  </div>

  <!-- Info Banner -->
  <InfoBanner
    message="Dashboard updated daily at 11:59pm UTC. Data collected since 12/06/2021."
    class="mt-4"
  />

  <!-- Application Selector (secondary) -->
  <div class="mt-6">
    <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Application</span>
    <div class="relative mt-1">
      <button
        class="flex w-64 items-center justify-between rounded-lg border border-border bg-panel px-3 py-2 text-sm text-ink"
        onclick={(e: MouseEvent) => { e.stopPropagation(); showAppDropdown = !showAppDropdown }}
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
        <div
          class="absolute z-10 mt-1 w-64 rounded-lg border border-border bg-panel py-1 shadow-card"
          role="menu"
          tabindex="-1"
          onclick={(e: MouseEvent) => e.stopPropagation()}
          onkeydown={(e: KeyboardEvent) => { if (e.key === 'Escape') showAppDropdown = false }}
        >
          {#each applicationStore.applications as app (app.id)}
            <button
              class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 {
                appId === app.id ? 'bg-blue-50 text-primary' : 'text-ink'
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

    <!-- Charts area -->
    <div class="mt-4 grid grid-cols-[1fr_220px] gap-4">
      <RevenueChart data={dashboardStore.data.revenueChart} class="h-80" />
      <PastWeekCard summary={dashboardStore.data.pastWeekSummary} />
    </div>

    <!-- Revenue Summary Table -->
    <RevenueSummaryTable rows={dashboardStore.data.revenueSummary} class="mt-4" />
  {/if}
</div>
```

**Step 4: Verify types**

Run: `bun run check`
Expected: No errors

**Step 5: Commit**

```bash
git add src/routes/applications/[id]/+layout.svelte src/routes/applications/[id]/+layout.ts src/routes/applications/[id]/+page.svelte
git commit -m "feat: add application detail layout and Revenue Overview (View 1)"
```

---

### Task 5: Create View 2 (Metrics Dashboard)

Move the existing metrics dashboard content (formerly at `/applications/[id]/+page.svelte`) into the new dashboard sub-route.

**Files:**
- Create: `src/routes/applications/[id]/dashboard/+page.svelte`

**Step 1: Create the Metrics Dashboard page**

```svelte
<!-- src/routes/applications/[id]/dashboard/+page.svelte -->
<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { appDetailStore } from '$lib/stores/appDetailStore.svelte'
  import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte'
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte'
  import InfoBanner from '$lib/components/ui/InfoBanner.svelte'
  import PageActions from '$lib/components/ui/PageActions.svelte'
  import MetricCard from '$lib/components/dashboard/MetricCard.svelte'
  import CampaignFilterBar from '$lib/components/dashboard/CampaignFilterBar.svelte'
  import type { TimeRange } from '$lib/types'

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: 'Dashboard' }
  ])

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

  $effect(() => {
    if (appId) {
      appDetailStore.loadAppDetail(appId)
    }
  })

  function handleTimeRangeChange(value: string) {
    appDetailStore.setTimeRange(value as TimeRange)
  }
</script>

<div class="p-6">
  <!-- Breadcrumb + Actions -->
  <div class="flex items-center justify-between">
    <Breadcrumb items={breadcrumbItems} />
    <PageActions />
  </div>

  <!-- Info Banner -->
  <InfoBanner
    message="Dashboard updated daily at 11:59pm UTC. Data collected since 12/06/2021."
    class="mt-4"
  />

  {#if appDetailStore.data}
    <!-- Campaign filters + Time range row -->
    <div class="mt-6 flex items-start justify-between">
      <CampaignFilterBar
        filters={appDetailStore.data.campaignFilters}
        activeFilters={appDetailStore.activeFilters}
        ontoggle={(status) => appDetailStore.toggleFilter(status)}
        onclear={() => appDetailStore.clearFilters()}
      />
      <SegmentedControl
        options={timeRangeOptions}
        selected={appDetailStore.timeRange}
        onchange={handleTimeRangeChange}
      />
    </div>

    <!-- Metric cards grid (3x2) -->
    <div class="mt-6 grid grid-cols-3 gap-4">
      {#each appDetailStore.data.metrics as metric (metric.id)}
        <MetricCard {metric} />
      {/each}
    </div>
  {/if}
</div>
```

**Step 2: Verify types**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/routes/applications/[id]/dashboard/+page.svelte
git commit -m "feat: add Metrics Dashboard (View 2) at /applications/[id]/dashboard"
```

---

### Task 6: Create placeholder pages for all application nav items

Create stub pages for every Zone B nav item that isn't Dashboard or the landing page. Each shows a simple "Coming soon" message with a breadcrumb.

**Files:**
- Create: `src/routes/applications/[id]/campaigns/+page.svelte`
- Create: `src/routes/applications/[id]/campaign-evaluation/+page.svelte`
- Create: `src/routes/applications/[id]/notifications/+page.svelte`
- Create: `src/routes/applications/[id]/stores/+page.svelte`
- Create: `src/routes/applications/[id]/cart-item-filters/+page.svelte`
- Create: `src/routes/applications/[id]/customers/+page.svelte`
- Create: `src/routes/applications/[id]/sessions/+page.svelte`
- Create: `src/routes/applications/[id]/events/+page.svelte`
- Create: `src/routes/applications/[id]/coupon-finder/+page.svelte`
- Create: `src/routes/applications/[id]/settings-app/+page.svelte`

**Step 1: Create a placeholder template**

All placeholder pages follow the same pattern. The only difference is the page title in the breadcrumb. Create each file with this template (substituting the title):

```svelte
<!-- Template for each placeholder page -->
<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte'

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: 'PAGE_TITLE' }
  ])
</script>

<div class="p-6">
  <Breadcrumb items={breadcrumbItems} />

  <div class="mt-12 flex flex-col items-center justify-center text-center">
    <h2 class="text-lg font-semibold text-ink">PAGE_TITLE</h2>
    <p class="mt-2 text-sm text-gray-500">This section is coming soon.</p>
  </div>
</div>
```

Use these title values for each file:

| File path | PAGE_TITLE |
|-----------|------------|
| `campaigns/+page.svelte` | Campaigns |
| `campaign-evaluation/+page.svelte` | Campaign Evaluation |
| `notifications/+page.svelte` | Notifications |
| `stores/+page.svelte` | Stores |
| `cart-item-filters/+page.svelte` | Cart Item Filters |
| `customers/+page.svelte` | Customers |
| `sessions/+page.svelte` | Sessions |
| `events/+page.svelte` | Events |
| `coupon-finder/+page.svelte` | Coupon Finder |
| `settings-app/+page.svelte` | Settings |

**Step 2: Verify types**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/routes/applications/[id]/campaigns/ src/routes/applications/[id]/campaign-evaluation/ src/routes/applications/[id]/notifications/ src/routes/applications/[id]/stores/ src/routes/applications/[id]/cart-item-filters/ src/routes/applications/[id]/customers/ src/routes/applications/[id]/sessions/ src/routes/applications/[id]/events/ src/routes/applications/[id]/coupon-finder/ src/routes/applications/[id]/settings-app/
git commit -m "feat: add placeholder pages for application nav items"
```

---

### Task 7: Update IconRail for route-aware active state

The IconRail currently uses exact `activeHref` matching. When inside `/applications/[id]`, it should still highlight the "Apps" nav item. Update the matching logic.

**Files:**
- Modify: `src/lib/components/layout/IconRail.svelte`

**Step 1: Update IconRail to use startsWith matching**

In `src/lib/components/layout/IconRail.svelte`, change the active state logic from exact match to prefix match. The change is in the class expression for nav items.

Replace the existing class expression for main nav items (line 39-43):
```
activeHref === item.href
```

With:
```
item.href === '/' ? activeHref === '/' || activeHref.startsWith('/applications') : activeHref.startsWith(item.href)
```

Wait — this won't work because `activeHref` is passed as a prop and might be a static value. Instead, the component should derive active state from the actual current route.

Update the component to accept the current path and derive active state:

Change the `activeHref` prop logic. Replace line 25:
```svelte
let { activeHref = '/' }: { activeHref?: string } = $props()
```

With:
```svelte
let { currentPath = '/' }: { currentPath?: string } = $props()
```

Then update the class comparison in both nav item loops. Replace each occurrence of:
```
activeHref === item.href
```

With a function-based check. Add this function after the props:
```typescript
function isItemActive(itemHref: string): boolean {
  if (itemHref === '/') {
    return currentPath === '/' || currentPath.startsWith('/applications')
  }
  return currentPath === itemHref || currentPath.startsWith(itemHref + '/')
}
```

Then use `isItemActive(item.href)` in the class expression instead of `activeHref === item.href`.

**Step 2: Update all usages of IconRail**

In `src/lib/components/layout/DashboardLayout.svelte` — currently renders `<IconRail />` with no props. It inherits the default `currentPath = '/'` which is correct for the home section.

Actually, `DashboardLayout.svelte` is used by the `(app)/+layout.svelte` (home section) where the user is at `/`. The default of `'/'` works.

In `src/routes/applications/[id]/+layout.svelte` — currently renders `<IconRail activeHref="/" />`. Update to use the new prop name:

```svelte
<IconRail currentPath={currentPath} />
```

Where `currentPath` is already derived from `page.url.pathname` in that layout.

**Step 3: Verify types**

Run: `bun run check`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/components/layout/IconRail.svelte src/routes/applications/[id]/+layout.svelte
git commit -m "refactor: update IconRail to use path-based active state matching"
```

---

### Task 8: Update home page to remove revenue dashboard content

The home page (`(app)/+page.svelte`) currently shows revenue charts and KPIs. Since those now live at `/applications/[id]` (View 1), the home page should focus on the application list. The application list is already in Zone B (ApplicationPanel sidebar), so Zone C should show a welcome/overview state.

**Files:**
- Modify: `src/routes/(app)/+page.svelte`

**Step 1: Simplify the home page**

Replace the content of `src/routes/(app)/+page.svelte` with a simpler overview that directs users to select an application:

```svelte
<!-- src/routes/(app)/+page.svelte -->
<script lang="ts">
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
</script>

<div class="p-6">
  <h1 class="text-xl font-bold text-ink">My Account Dashboard</h1>
  <p class="mt-2 text-sm text-gray-500">
    Select an application from the sidebar to view its dashboard.
  </p>

  {#if applicationStore.selectedApplication}
    <div class="mt-6">
      <a
        href="/applications/{applicationStore.selectedId}"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Open {applicationStore.selectedApplication.name}
      </a>
    </div>
  {/if}
</div>
```

**Step 2: Verify types**

Run: `bun run check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/routes/\(app\)/+page.svelte
git commit -m "refactor: simplify home page to direct users to application views"
```

---

### Task 9: Final verification

Run full type check and build to verify everything works.

**Step 1: Type check**

Run: `bun run check`
Expected: No errors

**Step 2: Production build**

Run: `bun run build`
Expected: Build succeeds with no errors

**Step 3: Manual verification checklist**

Start dev server with `bun run dev` and verify:

1. `/` — Shows simplified home page with application list in sidebar
2. Click an application card → navigates to `/applications/app-1`
3. `/applications/app-1` — Shows Revenue Overview with breadcrumb, banner, KPIs, chart, table
4. Zone B shows ApplicationContextPanel with app name, environment badge, nav items
5. Click "Dashboard" in Zone B → navigates to `/applications/app-1/dashboard`
6. `/applications/app-1/dashboard` — Shows Metrics Dashboard with filters and 6 metric cards
7. Breadcrumb: click app name → back to Revenue Overview, click "Apps" → back to home
8. Zone B app selector: switch to another app → URL updates, data reloads
9. Click any other Zone B nav item → shows placeholder page
10. IconRail "Apps" icon is highlighted while inside any application view

**Step 4: Commit any fixes**

If any issues found during manual verification, fix them and commit with descriptive messages.

---

## File summary

### New files (17)
- `src/lib/components/ui/Breadcrumb.svelte`
- `src/lib/components/ui/InfoBanner.svelte`
- `src/lib/components/ui/PageActions.svelte`
- `src/lib/components/layout/ApplicationContextPanel.svelte`
- `src/routes/(app)/+layout.svelte`
- `src/routes/(app)/+page.svelte` (moved from `src/routes/+page.svelte`)
- `src/routes/(app)/settings/+page.svelte` (moved from `src/routes/settings/+page.svelte`)
- `src/routes/applications/[id]/+layout.svelte`
- `src/routes/applications/[id]/+layout.ts`
- `src/routes/applications/[id]/dashboard/+page.svelte`
- 10 placeholder pages under `src/routes/applications/[id]/`

### Modified files (3)
- `src/routes/+layout.svelte` (simplified to minimal)
- `src/routes/applications/[id]/+page.svelte` (replaced: metrics → revenue overview)
- `src/lib/components/layout/IconRail.svelte` (path-based active state)

### Unchanged files
- All existing components in `src/lib/components/ui/` and `src/lib/components/dashboard/`
- All stores, services, mocks, types, and utils
- `src/lib/components/layout/AppShell.svelte` and `DashboardLayout.svelte`
- `src/app.css`, `src/app.html`
