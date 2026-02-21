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
