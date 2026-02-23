<script lang="ts">
  import { ChevronDown } from 'lucide-svelte'
  import type { CampaignFilterCount, CampaignFilterStatus } from '$lib/types'

  let {
    filters,
    activeFilters,
    ontoggle,
    onclear,
    class: className = ''
  }: {
    filters: CampaignFilterCount[]
    activeFilters: Set<CampaignFilterStatus>
    ontoggle: (status: CampaignFilterStatus) => void
    onclear: () => void
    class?: string
  } = $props()

  const hasActive = $derived(activeFilters.size > 0)
</script>

<div class={className}>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <!-- Section label -->
      <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Campaigns</span>

      <!-- Dropdown button -->
      <button class="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground">
        All campaigns
        <ChevronDown size={14} class="text-gray-400" />
      </button>
    </div>
  </div>

  <!-- Filter pills -->
  <div class="mt-3 flex flex-wrap items-center gap-2">
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
        {filter.label} ({filter.count.toLocaleString()})
      </button>
    {/each}

    {#if hasActive}
      <button
        class="text-xs text-primary hover:underline"
        onclick={onclear}
      >
        Clear all
      </button>
    {/if}
  </div>
</div>
