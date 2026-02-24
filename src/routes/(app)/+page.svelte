<script lang="ts">
  import { Info, X } from 'lucide-svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { dashboardStore } from '$lib/stores/dashboardStore.svelte'
  import * as Alert from '$lib/components/ui/alert/index.js'
  import AppSelector from '$lib/components/dashboard/AppSelector.svelte'
  import KpiCard from '$lib/components/dashboard/KpiCard.svelte'
  import TimeRangeSelector from '$lib/components/dashboard/TimeRangeSelector.svelte'
  import RevenueChart from '$lib/components/dashboard/RevenueChart.svelte'
  import InfluenceDonut from '$lib/components/dashboard/InfluenceDonut.svelte'
  import RevenueSummaryTable from '$lib/components/dashboard/RevenueSummaryTable.svelte'
  import type { TimeRange } from '$lib/types'

  let showBanner = $state(true)

  // Load dashboard when selected app changes
  $effect(() => {
    const id = applicationStore.selectedId
    if (id) {
      dashboardStore.loadDashboard(id)
    }
  })

  function handleAppSelect(id: string) {
    applicationStore.selectApplication(id)
  }

  function handleTimeRangeChange(range: TimeRange) {
    dashboardStore.setTimeRange(range)
    const id = applicationStore.selectedId
    if (id) {
      dashboardStore.loadDashboard(id)
    }
  }
</script>

<div class="space-y-6 p-6">
  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-foreground">My Account Dashboard</h1>
  </div>

  <!-- Info Banner -->
  {#if showBanner}
    <Alert.Root class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Info class="size-4 shrink-0" />
        <Alert.Description>
          Dashboard updated daily at 11:59pm UTC. Data collected since 12/06/2021.
        </Alert.Description>
      </div>
      <button
        onclick={() => showBanner = false}
        class="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
      >
        <X size={14} />
      </button>
    </Alert.Root>
  {/if}

  <!-- Application Selector -->
  <AppSelector
    applications={applicationStore.applications}
    selectedId={applicationStore.selectedId}
    onSelect={handleAppSelect}
  />

  {#if dashboardStore.data}
    <!-- KPI Row -->
    <div>
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Campaign Highlights
      </h2>
      <div class="grid grid-cols-3 gap-4">
        <KpiCard
          label="Running"
          value={dashboardStore.data.kpi.running}
          tooltip="Number of currently active campaigns"
          accentColor="text-primary"
        />
        <KpiCard
          label="Expiring soon"
          value={dashboardStore.data.kpi.expiringSoon}
          tooltip="Campaigns expiring within the next 7 days"
          accentColor="text-warning"
        />
        <KpiCard
          label="Low on budget"
          value={dashboardStore.data.kpi.lowOnBudget}
          tooltip="Campaigns with less than 10% budget remaining"
          accentColor="text-destructive"
        />
      </div>
    </div>

    <!-- Time Range -->
    <TimeRangeSelector
      value={dashboardStore.timeRange}
      onChange={handleTimeRangeChange}
    />

    <!-- Charts Row -->
    <div class="grid grid-cols-[1fr_280px] gap-4">
      <RevenueChart data={dashboardStore.data.revenueChart} />
      <InfluenceDonut summary={dashboardStore.data.pastWeekSummary} />
    </div>

    <!-- Revenue Summary Table -->
    <RevenueSummaryTable rows={dashboardStore.data.revenueSummary} />
  {:else if dashboardStore.loading}
    <div class="flex h-64 flex-col items-center justify-center gap-3">
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary"></div>
      <span class="text-sm text-muted-foreground">Loading dashboard...</span>
    </div>
  {:else}
    <div class="flex h-64 flex-col items-center justify-center gap-2">
      <span class="text-sm text-muted-foreground">Select an application to view analytics.</span>
    </div>
  {/if}
</div>
