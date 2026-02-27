<script lang="ts">
  import { onMount } from 'svelte'
  import { collectionStore } from '$lib/stores/collectionStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-svelte'
  import CollectionTable from '$lib/components/collections/CollectionTable.svelte'
  import CollectionSheet from '$lib/components/collections/CollectionSheet.svelte'

  onMount(() => {
    collectionStore.loadCollections()
    applicationStore.loadApplications()
  })

  const startItem = $derived(
    (collectionStore.currentPage - 1) * collectionStore.pageSize + 1,
  )
  const endItem = $derived(
    Math.min(
      collectionStore.currentPage * collectionStore.pageSize,
      collectionStore.totalFiltered,
    ),
  )
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="flex items-center justify-between px-8 pt-8 pb-2">
    <h1 class="text-2xl font-semibold">Collections</h1>
    <Button onclick={() => (collectionStore.createSheetOpen = true)}>
      <Plus size={16} class="mr-1.5" />
      Create Collection
    </Button>
  </div>

  <!-- Toolbar -->
  <div class="flex items-center gap-3 px-8 py-4">
    <div class="relative flex-1 max-w-md">
      <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Name or Description"
        value={collectionStore.searchQuery}
        oninput={(e: Event) =>
          collectionStore.setSearchQuery((e.target as HTMLInputElement).value)}
        class="pl-9"
      />
    </div>
  </div>

  <!-- Table -->
  <div class="flex-1 overflow-y-auto px-8">
    {#if collectionStore.loading}
      <div class="flex items-center justify-center py-16">
        <p class="text-muted-foreground">Loading collections...</p>
      </div>
    {:else if collectionStore.error}
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <p class="text-destructive">{collectionStore.error}</p>
          <Button
            variant="outline"
            class="mt-4"
            onclick={() => collectionStore.loadCollections()}
          >
            Retry
          </Button>
        </div>
      </div>
    {:else}
      <CollectionTable
        collections={collectionStore.paginatedCollections}
        onEdit={(collection) => collectionStore.openEditSheet(collection)}
      />
    {/if}
  </div>

  <!-- Pagination -->
  {#if collectionStore.totalFiltered > 0}
    <div
      class="flex items-center justify-end gap-2 px-8 py-3 border-t text-sm text-muted-foreground"
    >
      <span>{startItem} – {endItem}</span>
      <button
        class="p-1 rounded hover:bg-muted disabled:opacity-30"
        disabled={collectionStore.currentPage <= 1}
        onclick={() =>
          collectionStore.setPage(collectionStore.currentPage - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        class="p-1 rounded hover:bg-muted disabled:opacity-30"
        disabled={collectionStore.currentPage >= collectionStore.totalPages}
        onclick={() =>
          collectionStore.setPage(collectionStore.currentPage + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  {/if}

  <!-- Create Sheet -->
  <CollectionSheet
    mode="create"
    open={collectionStore.createSheetOpen}
    onOpenChange={(v) => (collectionStore.createSheetOpen = v)}
    onSubmit={async (req) => {
      await collectionStore.addCollection(req)
    }}
    applications={applicationStore.applications}
  />

  <!-- Edit Sheet -->
  <CollectionSheet
    mode="edit"
    collection={collectionStore.editingCollection ?? undefined}
    open={collectionStore.editSheetOpen}
    onOpenChange={(v) => {
      if (!v) collectionStore.closeEditSheet()
    }}
    onUpdate={async (req) => {
      if (collectionStore.editingCollection?.id) {
        await collectionStore.modifyCollection(collectionStore.editingCollection.id, req)
      }
    }}
    onDelete={async (id) => {
      await collectionStore.removeCollection(id)
    }}
    onImportItems={async (id, csvData) => {
      await collectionStore.importItems(id, csvData)
    }}
    onExportItems={async (id) => {
      return await collectionStore.exportItems(id)
    }}
    applications={applicationStore.applications}
  />
</div>
