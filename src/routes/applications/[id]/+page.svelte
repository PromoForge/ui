<script lang="ts">
  import { page } from '$app/state'
  import { X, Info, ChevronDown, ExternalLink } from 'lucide-svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { appDetailStore } from '$lib/stores/appDetailStore.svelte'
  import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte'
  import MetricCard from '$lib/components/dashboard/MetricCard.svelte'
  import CampaignFilterBar from '$lib/components/dashboard/CampaignFilterBar.svelte'
  import type { TimeRange } from '$lib/types'

  let showBanner = $state(true)

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

  // Sync store selection with route param and load data
  $effect(() => {
    const appId = page.params.id
    if (appId) {
      applicationStore.selectApplication(appId)
      appDetailStore.loadAppDetail(appId)
    }
  })

  function handleTimeRangeChange(value: string) {
    appDetailStore.setTimeRange(value as TimeRange)
  }

  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')
</script>

<div class="p-6">
  <!-- Breadcrumb + Actions -->
  <div class="flex items-center justify-between">
    <nav class="flex items-center gap-1 text-sm text-gray-500">
      <a href="/" class="hover:text-primary">Apps</a>
      <span>&rsaquo;</span>
      <span class="text-ink font-medium">{appName}</span>
      <span>&rsaquo;</span>
      <span class="text-ink font-medium">Dashboard</span>
    </nav>
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
  </div>

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
