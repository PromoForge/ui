<script lang="ts">
  import type { CampaignListFilterStatus } from '$lib/types'

  let {
    counts,
    activeFilters,
    ontoggle,
    onclear,
    class: className = ''
  }: {
    counts: Record<CampaignListFilterStatus, number>
    activeFilters: Set<CampaignListFilterStatus>
    ontoggle: (status: CampaignListFilterStatus) => void
    onclear: () => void
    class?: string
  } = $props()

  const filters: Array<{ status: CampaignListFilterStatus; label: string; color: string }> = [
    { status: 'scheduled', label: 'Scheduled', color: 'bg-green-500' },
    { status: 'running', label: 'Running', color: 'bg-green-500' },
    { status: 'expired', label: 'Expired', color: 'bg-danger' },
    { status: 'disabled', label: 'Disabled', color: 'bg-warning' },
    { status: 'lowOnBudget', label: 'Low on budget', color: 'bg-orange-400' },
    { status: 'expiringSoon', label: 'Expiring soon', color: 'bg-yellow-500' }
  ]

  const hasActive = $derived(activeFilters.size > 0)
</script>

<div class="flex flex-wrap items-center gap-2 {className}">
  {#each filters as filter (filter.status)}
    <button
      class="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors {
        activeFilters.has(filter.status)
          ? 'border-primary bg-blue-50 text-primary'
          : 'border-border bg-card text-gray-600 hover:border-gray-300'
      }"
      onclick={() => ontoggle(filter.status)}
    >
      <span class="inline-block h-2 w-2 rounded-full {filter.color}"></span>
      {filter.label} ({counts[filter.status].toLocaleString()})
    </button>
  {/each}

  {#if hasActive}
    <button class="text-xs text-primary hover:underline" onclick={onclear}>
      Clear all
    </button>
  {/if}
</div>
