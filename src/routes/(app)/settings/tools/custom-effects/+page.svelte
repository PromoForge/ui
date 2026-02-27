<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { customEffectStore } from '$lib/stores/customEffectStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Plus, ChevronLeft, ChevronRight, Search } from 'lucide-svelte'
  import CustomEffectTable from '$lib/components/custom-effects/CustomEffectTable.svelte'

  onMount(() => {
    customEffectStore.loadCustomEffects()
    applicationStore.loadApplications()
  })

  const startItem = $derived(
    (customEffectStore.currentPage - 1) * customEffectStore.pageSize + 1,
  )
  const endItem = $derived(
    Math.min(
      customEffectStore.currentPage * customEffectStore.pageSize,
      customEffectStore.totalFiltered,
    ),
  )
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="flex items-center justify-between px-8 pt-8 pb-2">
    <h1 class="text-2xl font-semibold">Custom Effects</h1>
    <Button onclick={() => goto('/settings/tools/custom-effects/new')}>
      <Plus size={16} class="mr-1.5" />
      Create Custom Effect
    </Button>
  </div>

  <!-- Search + Pagination -->
  <div class="px-8 pt-4 space-y-2">
    <div class="flex items-center justify-center">
      <div class="relative w-80">
        <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Name or Description"
          class="pl-9"
          value={customEffectStore.searchQuery}
          oninput={(e: Event) =>
            customEffectStore.setSearchQuery((e.target as HTMLInputElement).value)}
        />
      </div>
    </div>

    {#if customEffectStore.totalFiltered > 0}
      <div class="flex items-center justify-end gap-2">
        <span class="text-sm text-muted-foreground">
          {startItem} – {endItem} of {customEffectStore.totalFiltered}
        </span>
        <button
          class="p-1 rounded hover:bg-muted disabled:opacity-30"
          disabled={customEffectStore.currentPage <= 1}
          onclick={() => customEffectStore.setPage(customEffectStore.currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          class="p-1 rounded hover:bg-muted disabled:opacity-30"
          disabled={customEffectStore.currentPage >= customEffectStore.totalPages}
          onclick={() => customEffectStore.setPage(customEffectStore.currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    {/if}
  </div>

  <!-- Table -->
  <div class="flex-1 overflow-y-auto px-8 pt-4">
    {#if customEffectStore.loading}
      <div class="flex items-center justify-center py-16">
        <p class="text-muted-foreground">Loading custom effects...</p>
      </div>
    {:else if customEffectStore.error}
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <p class="text-destructive">{customEffectStore.error}</p>
          <Button variant="outline" class="mt-4" onclick={() => customEffectStore.loadCustomEffects()}>
            Retry
          </Button>
        </div>
      </div>
    {:else}
      <CustomEffectTable
        customEffects={customEffectStore.paginatedCustomEffects}
        applications={applicationStore.applications}
        onEdit={(effect) => goto(`/settings/tools/custom-effects/${effect.id}`)}
      />
    {/if}
  </div>
</div>
