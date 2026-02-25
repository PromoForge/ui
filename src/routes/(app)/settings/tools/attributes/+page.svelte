<script lang="ts">
  import { onMount } from 'svelte'
  import { attributeStore } from '$lib/stores/attributeStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-svelte'
  import AttributeTable from '$lib/components/attributes/AttributeTable.svelte'
  import AttributeFilterDropdown from '$lib/components/attributes/AttributeFilterDropdown.svelte'
  import AttributeSortDropdown from '$lib/components/attributes/AttributeSortDropdown.svelte'
  import CreateAttributeSheet from '$lib/components/attributes/CreateAttributeSheet.svelte'

  onMount(() => {
    attributeStore.loadAttributes()
    applicationStore.loadApplications()
  })

  const startItem = $derived((attributeStore.currentPage - 1) * attributeStore.pageSize + 1)
  const endItem = $derived(
    Math.min(attributeStore.currentPage * attributeStore.pageSize, attributeStore.totalFiltered)
  )
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="flex items-center justify-between px-8 pt-8 pb-2">
    <h1 class="text-2xl font-semibold">Attributes</h1>
    <Button onclick={() => (attributeStore.createSheetOpen = true)}>
      <Plus size={16} class="mr-1.5" />
      Create Attribute
    </Button>
  </div>

  <!-- Tabs -->
  <div class="px-8">
    <Tabs.Root
      value={attributeStore.activeTab}
      onValueChange={(v) => attributeStore.setActiveTab(v as 'custom' | 'builtin')}
    >
      <Tabs.List class="border-b border-border bg-transparent p-0 h-auto">
        <Tabs.Trigger
          value="custom"
          class="rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          Custom
        </Tabs.Trigger>
        <Tabs.Trigger
          value="builtin"
          class="rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          Built-in
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  </div>

  <!-- Toolbar -->
  <div class="flex items-center gap-3 px-8 py-4">
    <div class="relative flex-1 max-w-md">
      <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search attribute"
        value={attributeStore.searchQuery}
        oninput={(e: Event) => attributeStore.setSearchQuery((e.target as HTMLInputElement).value)}
        class="pl-9"
      />
    </div>
    <div class="ml-auto flex items-center gap-2">
      <AttributeFilterDropdown
        filters={attributeStore.filters}
        onToggle={(cat, val) => attributeStore.toggleFilter(cat, val)}
        activeFilterCount={attributeStore.activeFilterCount}
      />
      <AttributeSortDropdown
        sortBy={attributeStore.sortBy}
        onSort={(mode) => attributeStore.setSortBy(mode)}
      />
    </div>
  </div>

  <!-- Table -->
  <div class="flex-1 overflow-y-auto px-8">
    {#if attributeStore.loading}
      <div class="flex items-center justify-center py-16">
        <p class="text-muted-foreground">Loading attributes...</p>
      </div>
    {:else if attributeStore.error}
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <p class="text-destructive">{attributeStore.error}</p>
          <Button variant="outline" class="mt-4" onclick={() => attributeStore.loadAttributes()}>
            Retry
          </Button>
        </div>
      </div>
    {:else}
      <AttributeTable
        attributes={attributeStore.paginatedAttributes}
        onToggleVisibility={(attr) => attributeStore.toggleVisibility(attr)}
      />
    {/if}
  </div>

  <!-- Pagination -->
  {#if attributeStore.totalFiltered > 0}
    <div class="flex items-center justify-end gap-2 px-8 py-3 border-t text-sm text-muted-foreground">
      <span>
        {startItem} – {endItem}
      </span>
      <button
        class="p-1 rounded hover:bg-muted disabled:opacity-30"
        disabled={attributeStore.currentPage <= 1}
        onclick={() => attributeStore.setPage(attributeStore.currentPage - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        class="p-1 rounded hover:bg-muted disabled:opacity-30"
        disabled={attributeStore.currentPage >= attributeStore.totalPages}
        onclick={() => attributeStore.setPage(attributeStore.currentPage + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  {/if}

  <!-- Create Sheet -->
  <CreateAttributeSheet
    open={attributeStore.createSheetOpen}
    onOpenChange={(v) => (attributeStore.createSheetOpen = v)}
    onSubmit={async (req) => { await attributeStore.createAttribute(req) }}
    applications={applicationStore.applications}
  />
</div>
