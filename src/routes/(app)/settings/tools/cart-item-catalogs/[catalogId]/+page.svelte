<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { catalogStore } from '$lib/stores/catalogStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Search, ChevronLeft, ChevronRight, Pencil } from 'lucide-svelte'
  import CatalogDetailHeader from '$lib/components/catalogs/CatalogDetailHeader.svelte'
  import CatalogItemsTable from '$lib/components/catalogs/CatalogItemsTable.svelte'
  import CatalogSheet from '$lib/components/catalogs/CatalogSheet.svelte'

  const catalogId = $derived(Number($page.params.catalogId))

  onMount(() => {
    applicationStore.loadApplications()
    catalogStore.resetDetailState()
    catalogStore.loadCatalog(catalogId)
    catalogStore.loadItems(catalogId)

    return () => {
      catalogStore.resetDetailState()
    }
  })

  const startItem = $derived(
    catalogStore.itemsTotal > 0
      ? (catalogStore.itemsPage - 1) * catalogStore.itemsPageSize + 1
      : 0,
  )
  const endItem = $derived(
    Math.min(
      catalogStore.itemsPage * catalogStore.itemsPageSize,
      catalogStore.itemsTotal,
    ),
  )

  function handlePageChange(newPage: number) {
    catalogStore.setItemsPage(newPage)
    catalogStore.loadItems(catalogId)
  }

  const filterOptions = [
    { value: 'sku', label: 'SKU' },
    { value: 'product', label: 'Product' },
  ]
</script>

<div class="flex flex-col h-full">
  <!-- Breadcrumb + Edit button -->
  <div class="flex items-center justify-between px-8 pt-8 pb-2">
    <div class="flex items-center gap-2 text-sm">
      <a
        href="/settings/tools/cart-item-catalogs"
        class="text-muted-foreground hover:text-foreground"
      >
        Cart Item Catalogs
      </a>
      <span class="text-muted-foreground">&gt;</span>
      <span class="font-medium">{catalogStore.selectedCatalog?.name ?? '...'}</span>
    </div>
    <Button
      onclick={() => {
        if (catalogStore.selectedCatalog) {
          catalogStore.openEditSheet(catalogStore.selectedCatalog)
        }
      }}
    >
      <Pencil size={16} class="mr-1.5" />
      Edit Catalog
    </Button>
  </div>

  {#if catalogStore.itemsLoading && !catalogStore.selectedCatalog}
    <div class="flex items-center justify-center py-16">
      <p class="text-muted-foreground">Loading catalog...</p>
    </div>
  {:else if catalogStore.itemsError && !catalogStore.selectedCatalog}
    <div class="flex items-center justify-center py-16">
      <div class="text-center">
        <p class="text-destructive">{catalogStore.itemsError}</p>
        <Button
          variant="outline"
          class="mt-4"
          onclick={() => {
            catalogStore.loadCatalog(catalogId)
            catalogStore.loadItems(catalogId)
          }}
        >
          Retry
        </Button>
      </div>
    </div>
  {:else if catalogStore.selectedCatalog}
    <!-- Catalog metadata -->
    <div class="px-8 py-4">
      <CatalogDetailHeader catalog={catalogStore.selectedCatalog} />
    </div>

    <!-- Filter toolbar -->
    <div class="flex items-center gap-3 px-8 py-3">
      <Select.Root
        type="single"
        value={catalogStore.itemsFilterField}
        onValueChange={(v) => {
          if (v) catalogStore.setItemsFilterField(v)
        }}
      >
        <Select.Trigger class="w-28">
          {filterOptions.find((o) => o.value === catalogStore.itemsFilterField)?.label ?? 'SKU'}
        </Select.Trigger>
        <Select.Content>
          {#each filterOptions as option (option.value)}
            <Select.Item value={option.value}>{option.label}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>

      <div class="relative flex-1 max-w-md">
        <Search
          size={16}
          class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search"
          value={catalogStore.itemsSearchQuery}
          oninput={(e: Event) =>
            catalogStore.setItemsSearchQuery((e.target as HTMLInputElement).value)}
          class="pl-9"
        />
      </div>

      <!-- Pagination -->
      {#if catalogStore.itemsTotal > 0}
        <div class="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
          <span>{startItem} – {endItem}</span>
          <button
            class="p-1 rounded hover:bg-muted disabled:opacity-30"
            disabled={catalogStore.itemsPage <= 1}
            onclick={() => handlePageChange(catalogStore.itemsPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            class="p-1 rounded hover:bg-muted disabled:opacity-30"
            disabled={catalogStore.itemsPage >= catalogStore.itemsTotalPages}
            onclick={() => handlePageChange(catalogStore.itemsPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      {/if}
    </div>

    <!-- Items table -->
    <div class="flex-1 overflow-y-auto px-8">
      {#if catalogStore.itemsLoading}
        <div class="flex items-center justify-center py-16">
          <p class="text-muted-foreground">Loading items...</p>
        </div>
      {:else}
        <CatalogItemsTable items={catalogStore.filteredItems} />
      {/if}
    </div>
  {/if}

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
