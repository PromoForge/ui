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
