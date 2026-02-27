<script lang="ts">
  import { onMount } from 'svelte'
  import { catalogStore } from '$lib/stores/catalogStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Plus, ChevronLeft, ChevronRight } from 'lucide-svelte'
  import CatalogTable from '$lib/components/catalogs/CatalogTable.svelte'
  import CatalogSheet from '$lib/components/catalogs/CatalogSheet.svelte'

  onMount(() => {
    catalogStore.loadCatalogs()
    applicationStore.loadApplications()
  })

  const startItem = $derived(
    (catalogStore.currentPage - 1) * catalogStore.pageSize + 1,
  )
  const endItem = $derived(
    Math.min(
      catalogStore.currentPage * catalogStore.pageSize,
      catalogStore.totalFiltered,
    ),
  )
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="flex items-center justify-between px-8 pt-8 pb-2">
    <h1 class="text-2xl font-semibold">Cart Item Catalogs</h1>
    <div class="flex items-center gap-3">
      {#if catalogStore.totalFiltered > 0}
        <span class="text-sm text-muted-foreground">
          {startItem} – {endItem} of {catalogStore.totalFiltered}
        </span>
        <button
          class="p-1 rounded hover:bg-muted disabled:opacity-30"
          disabled={catalogStore.currentPage <= 1}
          onclick={() => catalogStore.setPage(catalogStore.currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          class="p-1 rounded hover:bg-muted disabled:opacity-30"
          disabled={catalogStore.currentPage >= catalogStore.totalPages}
          onclick={() => catalogStore.setPage(catalogStore.currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      {/if}
      <Button onclick={() => (catalogStore.createSheetOpen = true)}>
        <Plus size={16} class="mr-1.5" />
        Create Catalog
      </Button>
    </div>
  </div>

  <!-- Table -->
  <div class="flex-1 overflow-y-auto px-8 pt-4">
    {#if catalogStore.loading}
      <div class="flex items-center justify-center py-16">
        <p class="text-muted-foreground">Loading catalogs...</p>
      </div>
    {:else if catalogStore.error}
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <p class="text-destructive">{catalogStore.error}</p>
          <Button
            variant="outline"
            class="mt-4"
            onclick={() => catalogStore.loadCatalogs()}
          >
            Retry
          </Button>
        </div>
      </div>
    {:else}
      <CatalogTable
        catalogs={catalogStore.paginatedCatalogs}
        onEdit={(catalog) => catalogStore.openEditSheet(catalog)}
      />
    {/if}
  </div>

  <!-- Create Sheet -->
  <CatalogSheet
    mode="create"
    open={catalogStore.createSheetOpen}
    onOpenChange={(v) => (catalogStore.createSheetOpen = v)}
    onSubmit={async (req) => {
      await catalogStore.addCatalog(req)
    }}
    applications={applicationStore.applications}
  />

  <!-- Edit Sheet -->
  <CatalogSheet
    mode="edit"
    catalog={catalogStore.editingCatalog ?? undefined}
    open={catalogStore.editSheetOpen}
    onOpenChange={(v) => {
      if (!v) catalogStore.closeEditSheet()
    }}
    onUpdate={async (req) => {
      if (catalogStore.editingCatalog?.id) {
        await catalogStore.modifyCatalog(catalogStore.editingCatalog.id, req)
      }
    }}
    onDelete={async (id) => {
      await catalogStore.removeCatalog(id)
    }}
    applications={applicationStore.applications}
  />
</div>
