<script lang="ts">
  import { onMount } from 'svelte'
  import { additionalCostStore } from '$lib/stores/additionalCostStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-svelte'
  import AdditionalCostTable from '$lib/components/additional-costs/AdditionalCostTable.svelte'
  import AdditionalCostSheet from '$lib/components/additional-costs/AdditionalCostSheet.svelte'

  onMount(() => {
    additionalCostStore.loadAdditionalCosts()
    applicationStore.loadApplications()
  })

  const startItem = $derived(
    (additionalCostStore.currentPage - 1) * additionalCostStore.pageSize + 1,
  )
  const endItem = $derived(
    Math.min(
      additionalCostStore.currentPage * additionalCostStore.pageSize,
      additionalCostStore.totalFiltered,
    ),
  )
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="flex items-center justify-between px-8 pt-8 pb-2">
    <h1 class="text-2xl font-semibold">Additional Costs</h1>
    <Button onclick={() => (additionalCostStore.createSheetOpen = true)}>
      <Plus size={16} class="mr-1.5" />
      Create Additional Cost
    </Button>
  </div>

  <!-- Toolbar -->
  <div class="flex items-center gap-3 px-8 py-4">
    <div class="relative flex-1 max-w-md">
      <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search"
        value={additionalCostStore.searchQuery}
        oninput={(e: Event) =>
          additionalCostStore.setSearchQuery((e.target as HTMLInputElement).value)}
        class="pl-9"
      />
    </div>
  </div>

  <!-- Table -->
  <div class="flex-1 overflow-y-auto px-8">
    {#if additionalCostStore.loading}
      <div class="flex items-center justify-center py-16">
        <p class="text-muted-foreground">Loading additional costs...</p>
      </div>
    {:else if additionalCostStore.error}
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <p class="text-destructive">{additionalCostStore.error}</p>
          <Button
            variant="outline"
            class="mt-4"
            onclick={() => additionalCostStore.loadAdditionalCosts()}
          >
            Retry
          </Button>
        </div>
      </div>
    {:else}
      <AdditionalCostTable
        costs={additionalCostStore.paginatedCosts}
        onEdit={(cost) => additionalCostStore.openEditSheet(cost)}
      />
    {/if}
  </div>

  <!-- Pagination -->
  {#if additionalCostStore.totalFiltered > 0}
    <div
      class="flex items-center justify-end gap-2 px-8 py-3 border-t text-sm text-muted-foreground"
    >
      <span>{startItem} – {endItem}</span>
      <button
        class="p-1 rounded hover:bg-muted disabled:opacity-30"
        disabled={additionalCostStore.currentPage <= 1}
        onclick={() =>
          additionalCostStore.setPage(additionalCostStore.currentPage - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        class="p-1 rounded hover:bg-muted disabled:opacity-30"
        disabled={additionalCostStore.currentPage >= additionalCostStore.totalPages}
        onclick={() =>
          additionalCostStore.setPage(additionalCostStore.currentPage + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  {/if}

  <!-- Create Sheet -->
  <AdditionalCostSheet
    mode="create"
    open={additionalCostStore.createSheetOpen}
    onOpenChange={(v) => (additionalCostStore.createSheetOpen = v)}
    onSubmit={async (req) => {
      await additionalCostStore.createCost(req)
    }}
    applications={applicationStore.applications}
  />

  <!-- Edit Sheet -->
  <AdditionalCostSheet
    mode="edit"
    cost={additionalCostStore.editingCost ?? undefined}
    open={additionalCostStore.editSheetOpen}
    onOpenChange={(v) => {
      if (!v) additionalCostStore.closeEditSheet()
    }}
    onUpdate={async (req) => {
      if (additionalCostStore.editingCost?.id) {
        await additionalCostStore.updateCost(additionalCostStore.editingCost.id, req)
      }
    }}
    onDelete={async (id) => {
      await additionalCostStore.removeCost(id)
    }}
    applications={applicationStore.applications}
  />
</div>
