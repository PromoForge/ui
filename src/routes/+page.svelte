<script lang="ts">
  import { X, Info, ChevronDown } from 'lucide-svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { dashboardStore } from '$lib/stores/dashboardStore.svelte'
  import StatCard from '$lib/components/ui/StatCard.svelte'
  import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import type { TimeRange } from '$lib/types'
  import RevenueChart from '$lib/components/dashboard/RevenueChart.svelte'
  import PastWeekCard from '$lib/components/dashboard/PastWeekCard.svelte'

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
    <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Application</span>
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

    <!-- Charts area -->
    <div class="mt-4 grid grid-cols-[1fr_220px] gap-4">
      <RevenueChart data={dashboardStore.data.revenueChart} class="h-80" />
      <PastWeekCard summary={dashboardStore.data.pastWeekSummary} />
    </div>

    <!-- Table placeholder — filled in Task 14 -->
    <div class="mt-4 flex h-48 items-center justify-center rounded-lg bg-panel shadow-card">
      <span class="text-sm text-gray-400">Revenue summary table — next task</span>
    </div>
  {/if}
</div>
