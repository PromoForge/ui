# Cart Item Catalogs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Cart Item Catalogs management UI with list page, create/edit sheets, and detail page with catalog items table, all connected to read APIs.

**Architecture:** Follows the existing collections pattern — service layer wraps generated SDK, rune-based store manages state, Svelte components use shadcn-svelte primitives, and SvelteKit routes render the pages. New addition: a detail page (`[catalogId]`) for viewing catalog items, unlike collections which only use list + sheets.

**Tech Stack:** SvelteKit 2, Svelte 5, Tailwind CSS v4, shadcn-svelte (Bits UI), TypeScript, Playwright (E2E)

---

### Task 1: Catalog Service Layer

**Files:**
- Create: `src/lib/services/catalogService.ts`

**Step 1: Create the service file**

Reference: `src/lib/services/collectionService.ts` (same pattern — import SDK functions, wrap with error handling, return typed data).

```typescript
import {
  backstageServiceListCatalogs,
  backstageServiceCreateCatalog,
  backstageServiceGetCatalog,
  backstageServiceUpdateCatalog,
  backstageServiceDeleteCatalog,
  backstageServiceListCatalogItems,
} from '$lib/api/generated'
import type {
  Catalog,
  CatalogItem,
  CreateCatalogRequest,
  UpdateCatalogRequest,
} from '$lib/api/generated/types.gen'

export async function listCatalogs(): Promise<{
  data: Catalog[]
  total: number
}> {
  const { data, error } = await backstageServiceListCatalogs({
    query: { pageSize: 1000 },
  })
  if (error) {
    throw new Error('Failed to load catalogs')
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  }
}

export async function createCatalog(request: CreateCatalogRequest): Promise<Catalog> {
  const { data, error } = await backstageServiceCreateCatalog({
    body: request,
  })
  if (error) {
    throw new Error('Failed to create catalog')
  }
  return data!.catalog!
}

export async function getCatalog(catalogId: number): Promise<Catalog> {
  const { data, error } = await backstageServiceGetCatalog({
    path: { catalogId },
  })
  if (error) {
    throw new Error('Failed to load catalog')
  }
  return data!.catalog!
}

export async function updateCatalog(
  catalogId: number,
  request: Omit<UpdateCatalogRequest, 'catalogId'>,
): Promise<Catalog> {
  const { data, error } = await backstageServiceUpdateCatalog({
    path: { catalogId },
    body: { ...request, catalogId },
  })
  if (error) {
    throw new Error('Failed to update catalog')
  }
  return data!.catalog!
}

export async function deleteCatalog(catalogId: number): Promise<void> {
  const { error } = await backstageServiceDeleteCatalog({
    path: { catalogId },
  })
  if (error) {
    throw new Error('Failed to delete catalog')
  }
}

export async function listCatalogItems(
  catalogId: number,
  pageSize = 50,
  skip = 0,
): Promise<{ data: CatalogItem[]; total: number }> {
  const { data, error } = await backstageServiceListCatalogItems({
    path: { catalogId },
    query: { pageSize, skip },
  })
  if (error) {
    throw new Error('Failed to load catalog items')
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  }
}
```

**Step 2: Run type check**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`
Expected: No errors related to catalogService

**Step 3: Commit**

```bash
git add src/lib/services/catalogService.ts
git commit -m "feat(catalogs): add catalog service layer"
```

---

### Task 2: Catalog Store

**Files:**
- Create: `src/lib/stores/catalogStore.svelte.ts`

**Step 1: Create the store file**

Reference: `src/lib/stores/collectionStore.svelte.ts` (same pattern — `$state`, `$derived`, getter/setter exports). This store manages both the list page state AND the detail page state (selected catalog + items).

```typescript
import {
  listCatalogs,
  getCatalog as getCatalogApi,
  createCatalog as createCatalogApi,
  updateCatalog as updateCatalogApi,
  deleteCatalog as deleteCatalogApi,
  listCatalogItems,
} from '$lib/services/catalogService'
import type {
  Catalog,
  CatalogItem,
  CreateCatalogRequest,
  UpdateCatalogRequest,
} from '$lib/api/generated/types.gen'

function createCatalogStore() {
  // List page state
  let catalogs = $state<Catalog[]>([])
  let loading = $state(false)
  let error = $state<string | null>(null)
  let searchQuery = $state('')
  let currentPage = $state(1)
  let pageSize = $state(50)
  let createSheetOpen = $state(false)
  let editSheetOpen = $state(false)
  let editingCatalog = $state<Catalog | null>(null)

  // Detail page state
  let selectedCatalog = $state<Catalog | null>(null)
  let catalogItems = $state<CatalogItem[]>([])
  let itemsLoading = $state(false)
  let itemsError = $state<string | null>(null)
  let itemsTotal = $state(0)
  let itemsPage = $state(1)
  let itemsPageSize = $state(50)
  let itemsSearchQuery = $state('')
  let itemsFilterField = $state('sku')

  // List page derived
  const filteredCatalogs = $derived.by(() => {
    let result = catalogs
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q),
      )
    }
    return result
  })

  const totalFiltered = $derived(filteredCatalogs.length)
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)))
  const paginatedCatalogs = $derived(
    filteredCatalogs.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  )

  // Detail page derived — client-side filtering of loaded items
  const filteredItems = $derived.by(() => {
    if (!itemsSearchQuery.trim()) return catalogItems
    const q = itemsSearchQuery.toLowerCase()
    return catalogItems.filter((item) => {
      if (itemsFilterField === 'sku') {
        return (item.sku ?? '').toLowerCase().includes(q)
      }
      if (itemsFilterField === 'product') {
        return (item.product?.name ?? '').toLowerCase().includes(q)
      }
      return true
    })
  })

  const itemsTotalPages = $derived(Math.max(1, Math.ceil(itemsTotal / itemsPageSize)))

  // List page actions
  async function loadCatalogs() {
    if (loading) return
    loading = true
    error = null
    try {
      const result = await listCatalogs()
      catalogs = result.data
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load catalogs'
    } finally {
      loading = false
    }
  }

  function setSearchQuery(query: string) {
    searchQuery = query
    currentPage = 1
  }

  function setPage(p: number) {
    currentPage = Math.max(1, Math.min(p, totalPages))
  }

  async function addCatalog(request: CreateCatalogRequest): Promise<Catalog> {
    const catalog = await createCatalogApi(request)
    catalogs = [catalog, ...catalogs]
    return catalog
  }

  function openEditSheet(catalog: Catalog) {
    editingCatalog = catalog
    editSheetOpen = true
  }

  function closeEditSheet() {
    editSheetOpen = false
    editingCatalog = null
  }

  async function modifyCatalog(
    id: number,
    request: Omit<UpdateCatalogRequest, 'catalogId'>,
  ): Promise<void> {
    const updated = await updateCatalogApi(id, request)
    catalogs = catalogs.map((c) => (c.id === updated.id ? updated : c))
    // Also update selectedCatalog if viewing detail page
    if (selectedCatalog?.id === updated.id) {
      selectedCatalog = updated
    }
  }

  async function removeCatalog(id: number): Promise<void> {
    await deleteCatalogApi(id)
    catalogs = catalogs.filter((c) => c.id !== id)
  }

  // Detail page actions
  async function loadCatalog(catalogId: number) {
    itemsLoading = true
    itemsError = null
    try {
      selectedCatalog = await getCatalogApi(catalogId)
    } catch (e) {
      itemsError = e instanceof Error ? e.message : 'Failed to load catalog'
    } finally {
      itemsLoading = false
    }
  }

  async function loadItems(catalogId: number) {
    itemsLoading = true
    itemsError = null
    try {
      const skip = (itemsPage - 1) * itemsPageSize
      const result = await listCatalogItems(catalogId, itemsPageSize, skip)
      catalogItems = result.data
      itemsTotal = result.total
    } catch (e) {
      itemsError = e instanceof Error ? e.message : 'Failed to load catalog items'
    } finally {
      itemsLoading = false
    }
  }

  function setItemsPage(p: number) {
    itemsPage = Math.max(1, Math.min(p, itemsTotalPages))
  }

  function setItemsSearchQuery(query: string) {
    itemsSearchQuery = query
  }

  function setItemsFilterField(field: string) {
    itemsFilterField = field
  }

  function resetDetailState() {
    selectedCatalog = null
    catalogItems = []
    itemsLoading = false
    itemsError = null
    itemsTotal = 0
    itemsPage = 1
    itemsSearchQuery = ''
    itemsFilterField = 'sku'
  }

  return {
    // List page state
    get catalogs() { return catalogs },
    get loading() { return loading },
    get error() { return error },
    get searchQuery() { return searchQuery },
    get currentPage() { return currentPage },
    get pageSize() { return pageSize },
    get createSheetOpen() { return createSheetOpen },
    set createSheetOpen(v: boolean) { createSheetOpen = v },
    get editSheetOpen() { return editSheetOpen },
    set editSheetOpen(v: boolean) { editSheetOpen = v },
    get editingCatalog() { return editingCatalog },
    get filteredCatalogs() { return filteredCatalogs },
    get paginatedCatalogs() { return paginatedCatalogs },
    get totalFiltered() { return totalFiltered },
    get totalPages() { return totalPages },

    // Detail page state
    get selectedCatalog() { return selectedCatalog },
    get catalogItems() { return catalogItems },
    get filteredItems() { return filteredItems },
    get itemsLoading() { return itemsLoading },
    get itemsError() { return itemsError },
    get itemsTotal() { return itemsTotal },
    get itemsPage() { return itemsPage },
    get itemsPageSize() { return itemsPageSize },
    get itemsSearchQuery() { return itemsSearchQuery },
    get itemsFilterField() { return itemsFilterField },
    get itemsTotalPages() { return itemsTotalPages },

    // List page actions
    loadCatalogs,
    setSearchQuery,
    setPage,
    addCatalog,
    openEditSheet,
    closeEditSheet,
    modifyCatalog,
    removeCatalog,

    // Detail page actions
    loadCatalog,
    loadItems,
    setItemsPage,
    setItemsSearchQuery,
    setItemsFilterField,
    resetDetailState,
  }
}

export const catalogStore = createCatalogStore()
```

**Step 2: Run type check**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/stores/catalogStore.svelte.ts
git commit -m "feat(catalogs): add catalog store with list and detail state"
```

---

### Task 3: CatalogTable Component

**Files:**
- Create: `src/lib/components/catalogs/CatalogTable.svelte`

**Step 1: Create the component**

Reference: `src/lib/components/collections/CollectionTable.svelte`. Key difference: Name column links to detail page (`/settings/tools/cart-item-catalogs/{id}`) instead of opening edit sheet, and there's a separate Edit column with a pencil icon.

```svelte
<script lang="ts">
  import type { Catalog } from '$lib/api/generated/types.gen'
  import * as Table from '$lib/components/ui/table/index.js'
  import { LayoutGrid, Pencil } from 'lucide-svelte'

  let {
    catalogs,
    onEdit,
  }: {
    catalogs: Catalog[]
    onEdit?: (catalog: Catalog) => void
  } = $props()
</script>

<Table.Root>
  <Table.Header>
    <Table.Row class="border-b">
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Name
      </Table.Head>
      <Table.Head class="w-24 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        ID
      </Table.Head>
      <Table.Head class="w-40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Applications
      </Table.Head>
      <Table.Head class="w-16 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Edit
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each catalogs as catalog (catalog.id)}
      <Table.Row class="group hover:bg-muted/50">
        <Table.Cell>
          <a
            href="/settings/tools/cart-item-catalogs/{catalog.id}"
            class="text-sm font-medium text-primary hover:underline"
          >
            {catalog.name ?? '—'}
          </a>
        </Table.Cell>
        <Table.Cell class="text-sm text-muted-foreground">
          {catalog.id}
        </Table.Cell>
        <Table.Cell>
          <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <LayoutGrid size={16} />
            {catalog.subscribedApplicationsIds?.length ?? 0}
          </div>
        </Table.Cell>
        <Table.Cell>
          <button
            class="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            onclick={() => onEdit?.(catalog)}
          >
            <Pencil size={16} />
          </button>
        </Table.Cell>
      </Table.Row>
    {/each}

    {#if catalogs.length === 0}
      <Table.Row>
        <Table.Cell colspan={4} class="h-32 text-center text-muted-foreground">
          No catalogs found.
        </Table.Cell>
      </Table.Row>
    {/if}
  </Table.Body>
</Table.Root>
```

**Step 2: Run type check**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`

**Step 3: Commit**

```bash
git add src/lib/components/catalogs/CatalogTable.svelte
git commit -m "feat(catalogs): add CatalogTable component"
```

---

### Task 4: CatalogSheet Component (Create / Edit)

**Files:**
- Create: `src/lib/components/catalogs/CatalogSheet.svelte`

**Step 1: Create the component**

Reference: `src/lib/components/collections/CollectionSheet.svelte`. Same Sheet + form pattern. Key differences: description has 200 char counter, no import/export section, includes delete section in edit mode.

```svelte
<script lang="ts">
  import type {
    Application,
    Catalog,
    CreateCatalogRequest,
    UpdateCatalogRequest,
  } from '$lib/api/generated/types.gen'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { CircleHelp, Trash2 } from 'lucide-svelte'

  let {
    mode = 'create',
    catalog = undefined,
    open = false,
    onOpenChange,
    onSubmit,
    onUpdate,
    onDelete,
    applications = [],
  }: {
    mode?: 'create' | 'edit'
    catalog?: Catalog
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit?: (request: CreateCatalogRequest) => Promise<void>
    onUpdate?: (request: Omit<UpdateCatalogRequest, 'catalogId'>) => Promise<void>
    onDelete?: (catalogId: number) => Promise<void>
    applications: Application[]
  } = $props()

  // Form state
  let name = $state('')
  let description = $state('')
  let selectedAppIds = $state<number[]>([])
  let appDropdownOpen = $state(false)
  let submitting = $state(false)
  let attempted = $state(false)
  let submitError = $state('')

  // Delete dialog state
  let deleteDialogOpen = $state(false)
  let deleting = $state(false)
  let deleteError = $state('')

  // Validation
  const nameError = $derived(attempted && !name.trim() ? 'Name is required' : '')
  const descriptionLength = $derived(description.length)

  // Pre-populate form in edit mode
  $effect(() => {
    if (mode === 'edit' && catalog && open) {
      name = catalog.name ?? ''
      description = catalog.description ?? ''
      selectedAppIds = catalog.subscribedApplicationsIds
        ? [...catalog.subscribedApplicationsIds]
        : []
    }
  })

  function toggleApp(appId: number) {
    if (selectedAppIds.includes(appId)) {
      selectedAppIds = selectedAppIds.filter((id) => id !== appId)
    } else {
      selectedAppIds = [...selectedAppIds, appId]
    }
  }

  function removeApp(appId: number) {
    selectedAppIds = selectedAppIds.filter((id) => id !== appId)
  }

  function resetForm() {
    name = ''
    description = ''
    selectedAppIds = []
    appDropdownOpen = false
    submitting = false
    attempted = false
    submitError = ''
  }

  function handleCancel() {
    resetForm()
    onOpenChange(false)
  }

  async function handleSubmit() {
    attempted = true
    submitError = ''
    if (!name.trim()) return

    submitting = true
    try {
      const subscribedApplicationsIds =
        selectedAppIds.length > 0 ? selectedAppIds : undefined

      if (mode === 'create') {
        await onSubmit?.({
          name: name.trim(),
          description: description.trim() || undefined,
          subscribedApplicationsIds,
        })
      } else {
        await onUpdate?.({
          name: name.trim(),
          description: description.trim() || undefined,
          subscribedApplicationsIds,
        })
      }
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError =
        e instanceof Error
          ? e.message
          : mode === 'create'
            ? 'Failed to create catalog'
            : 'Failed to update catalog'
    } finally {
      submitting = false
    }
  }

  async function handleDelete() {
    if (!catalog?.id) return
    deleting = true
    deleteError = ''
    try {
      await onDelete?.(catalog.id)
      deleteDialogOpen = false
      resetForm()
      onOpenChange(false)
    } catch (e) {
      deleteError = e instanceof Error ? e.message : 'Failed to delete catalog'
    } finally {
      deleting = false
    }
  }

  function handleSheetOpenChange(isOpen: boolean) {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }
</script>

<Sheet.Root {open} onOpenChange={handleSheetOpenChange}>
  <Sheet.Content side="right" class="w-[480px] sm:max-w-[480px] flex flex-col">
    <Sheet.Header>
      <Sheet.Title class="sr-only">
        {mode === 'edit' ? 'Edit Catalog' : 'Create Catalog'}
      </Sheet.Title>
      <Sheet.Description class="text-sm text-foreground">
        Edit the name, description, and connected Applications of the catalog.
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
      {#if submitError}
        <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      {/if}

      <!-- Catalog name -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Catalog name</Label>
        <Input
          value={name}
          oninput={(e: Event) => {
            name = (e.target as HTMLInputElement).value
          }}
          class={nameError ? 'border-destructive ring-destructive' : ''}
        />
        {#if nameError}
          <p class="text-xs text-destructive font-medium">{nameError}</p>
        {/if}
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Description</Label>
        <textarea
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          value={description}
          maxlength={200}
          oninput={(e: Event) => {
            description = (e.target as HTMLTextAreaElement).value
          }}
        ></textarea>
        <p class="text-xs text-muted-foreground text-right">{descriptionLength} / 200</p>
      </div>

      <!-- Connected Applications -->
      <div class="space-y-2">
        <div class="flex items-center gap-1.5">
          <h3 class="text-base font-medium">Connected Applications</h3>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Select the Applications you want to connect to the catalog.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <p class="text-sm text-muted-foreground">
          Select the Applications you want to connect to the catalog.
        </p>
        <Popover.Root bind:open={appDropdownOpen}>
          <Popover.Trigger
            class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <span class={selectedAppIds.length === 0 ? 'text-muted-foreground' : ''}>
              {selectedAppIds.length === 0 ? 'Select Application' : `${selectedAppIds.length} selected`}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-muted-foreground"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Popover.Trigger>
          <Popover.Content class="w-[--bits-popover-trigger-width] p-0" align="start">
            <div class="max-h-48 overflow-y-auto py-1">
              {#each applications as app (app.id)}
                {@const isSelected = selectedAppIds.includes(app.id ?? 0)}
                <button
                  class="flex w-full items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors
                    {isSelected ? 'bg-accent' : 'hover:bg-accent/50'}"
                  onclick={() => toggleApp(app.id ?? 0)}
                >
                  <Checkbox
                    checked={isSelected}
                    class="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div class="text-left">
                    <span class="font-medium">{app.name ?? 'Unnamed'}</span>
                    {#if app.description}
                      <span class="text-muted-foreground ml-2">{app.description}</span>
                    {/if}
                  </div>
                </button>
              {/each}
              {#if applications.length === 0}
                <p class="px-3 py-2 text-sm text-muted-foreground">No applications found.</p>
              {/if}
            </div>
          </Popover.Content>
        </Popover.Root>

        <!-- Existing Connections label + selected apps as chips -->
        {#if selectedAppIds.length > 0}
          <p class="text-sm font-medium text-muted-foreground">Existing Connections</p>
          <div class="space-y-1">
            {#each selectedAppIds as appId (appId)}
              {@const app = applications.find((a) => a.id === appId)}
              {#if app}
                <div class="flex items-center justify-between rounded-md border px-3 py-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-sm font-medium truncate">{app.name ?? 'Unnamed'}</span>
                    {#if app.description}
                      <span class="text-sm text-muted-foreground truncate">{app.description}</span>
                    {/if}
                  </div>
                  <button
                    class="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    onclick={() => removeApp(appId)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>

      <!-- Delete Catalog (edit mode only) -->
      {#if mode === 'edit'}
        <Separator class="my-2" />
        <div class="space-y-2 pt-2">
          <h3 class="text-base font-medium text-destructive">Delete catalog</h3>
          <p class="text-sm text-muted-foreground">
            Deleting the catalog also deletes its items. This action cannot be undone.
          </p>
          <Button
            variant="outline"
            class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
            onclick={() => (deleteDialogOpen = true)}
          >
            <Trash2 size={14} class="mr-1.5" />
            Delete Catalog
          </Button>
        </div>
      {/if}
    </div>

    <Sheet.Footer class="border-t px-6 py-4">
      <Button variant="ghost" onclick={handleCancel} disabled={submitting}>
        Cancel
      </Button>
      <Button onclick={handleSubmit} disabled={submitting}>
        {#if submitting}
          {mode === 'edit' ? 'Saving...' : 'Creating...'}
        {:else}
          {mode === 'edit' ? 'Save' : 'Create Catalog'}
        {/if}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>

<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete Catalog</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete {catalog?.name ?? 'this catalog'}?
        This action is permanent and will also delete all items in the catalog.
      </Dialog.Description>
    </Dialog.Header>
    {#if deleteError}
      <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {deleteError}
      </div>
    {/if}
    <Dialog.Footer>
      <Button variant="ghost" onclick={() => (deleteDialogOpen = false)} disabled={deleting}>
        Cancel
      </Button>
      <Button
        variant="outline"
        class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
        onclick={handleDelete}
        disabled={deleting}
      >
        {#if deleting}
          Deleting...
        {:else}
          <Trash2 size={14} class="mr-1.5" />
          Delete Catalog
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

**Step 2: Run type check**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`

**Step 3: Commit**

```bash
git add src/lib/components/catalogs/CatalogSheet.svelte
git commit -m "feat(catalogs): add CatalogSheet create/edit component"
```

---

### Task 5: CatalogDetailHeader Component

**Files:**
- Create: `src/lib/components/catalogs/CatalogDetailHeader.svelte`

**Step 1: Create the component**

This is new — no direct equivalent in collections. Shows catalog metadata: name (copyable), ID (copyable), connected applications count, and description.

```svelte
<script lang="ts">
  import type { Catalog } from '$lib/api/generated/types.gen'
  import { LayoutGrid, Copy, Check } from 'lucide-svelte'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

  let { catalog }: { catalog: Catalog } = $props()

  let copiedName = $state(false)
  let copiedId = $state(false)

  async function copyToClipboard(text: string, field: 'name' | 'id') {
    await navigator.clipboard.writeText(text)
    if (field === 'name') {
      copiedName = true
      setTimeout(() => (copiedName = false), 2000)
    } else {
      copiedId = true
      setTimeout(() => (copiedId = false), 2000)
    }
  }
</script>

<div class="space-y-3">
  <!-- Metadata row -->
  <div class="flex items-start gap-12 text-sm">
    <div>
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catalog Name</p>
      <div class="flex items-center gap-1.5 mt-1">
        <span class="font-medium">{catalog.name ?? '—'}</span>
        <Tooltip.Root>
          <Tooltip.Trigger>
            <button
              class="p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              onclick={() => copyToClipboard(catalog.name ?? '', 'name')}
            >
              {#if copiedName}
                <Check size={14} class="text-green-600" />
              {:else}
                <Copy size={14} />
              {/if}
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>{copiedName ? 'Copied!' : 'Copy name'}</p>
          </Tooltip.Content>
        </Tooltip.Root>
      </div>
    </div>

    <div>
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catalog ID</p>
      <div class="flex items-center gap-1.5 mt-1">
        <span class="font-medium">{catalog.id ?? '—'}</span>
        <Tooltip.Root>
          <Tooltip.Trigger>
            <button
              class="p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              onclick={() => copyToClipboard(String(catalog.id ?? ''), 'id')}
            >
              {#if copiedId}
                <Check size={14} class="text-green-600" />
              {:else}
                <Copy size={14} />
              {/if}
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>{copiedId ? 'Copied!' : 'Copy ID'}</p>
          </Tooltip.Content>
        </Tooltip.Root>
      </div>
    </div>

    <div>
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connected Applications</p>
      <div class="flex items-center gap-1.5 mt-1">
        <LayoutGrid size={16} class="text-muted-foreground" />
        <span class="font-medium">{catalog.subscribedApplicationsIds?.length ?? 0}</span>
      </div>
    </div>
  </div>

  <!-- Description -->
  {#if catalog.description}
    <p class="text-sm text-muted-foreground">{catalog.description}</p>
  {/if}
</div>
```

**Step 2: Run type check**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`

**Step 3: Commit**

```bash
git add src/lib/components/catalogs/CatalogDetailHeader.svelte
git commit -m "feat(catalogs): add CatalogDetailHeader component"
```

---

### Task 6: CatalogItemsTable Component

**Files:**
- Create: `src/lib/components/catalogs/CatalogItemsTable.svelte`

**Step 1: Create the component**

Table with columns: Product, SKU, Price, Promo price. "Promo price" header uses a green badge style per the screenshot.

```svelte
<script lang="ts">
  import type { CatalogItem } from '$lib/api/generated/types.gen'
  import * as Table from '$lib/components/ui/table/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'

  let { items }: { items: CatalogItem[] } = $props()
</script>

<Table.Root>
  <Table.Header>
    <Table.Row class="border-b">
      <Table.Head class="text-xs font-semibold uppercase tracking-wider">
        <Badge variant="outline" class="text-primary border-primary">Product</Badge>
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider">
        <Badge variant="outline" class="text-primary border-primary">SKU</Badge>
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider">
        <Badge variant="outline" class="text-primary border-primary">Price</Badge>
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider">
        <Badge class="bg-green-600 text-white hover:bg-green-600">Promo price</Badge>
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each items as item (item.catalogItemId ?? item.sku)}
      <Table.Row class="hover:bg-muted/50">
        <Table.Cell class="text-sm">
          {item.product?.name ?? 'No product'}
        </Table.Cell>
        <Table.Cell class="text-sm text-muted-foreground">
          {item.sku ?? '—'}
        </Table.Cell>
        <Table.Cell class="text-sm text-muted-foreground">
          {item.price != null ? item.price.toFixed(2) : '—'}
        </Table.Cell>
        <Table.Cell class="text-sm text-muted-foreground">
          {item.attributes?.promo_price ?? '–'}
        </Table.Cell>
      </Table.Row>
    {/each}

    {#if items.length === 0}
      <Table.Row>
        <Table.Cell colspan={4} class="h-32 text-center text-muted-foreground">
          No items found.
        </Table.Cell>
      </Table.Row>
    {/if}
  </Table.Body>
</Table.Root>
```

**Step 2: Run type check**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`

**Step 3: Commit**

```bash
git add src/lib/components/catalogs/CatalogItemsTable.svelte
git commit -m "feat(catalogs): add CatalogItemsTable component"
```

---

### Task 7: Cart Item Catalogs List Page

**Files:**
- Modify: `src/routes/(app)/settings/tools/cart-item-catalogs/+page.svelte`

**Step 1: Replace the placeholder with the full list page**

Reference: `src/routes/(app)/settings/tools/collections/+page.svelte`. Same structure: header with Create button, search, table, pagination, create/edit sheets.

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { catalogStore } from '$lib/stores/catalogStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-svelte'
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
```

**Step 2: Run type check**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`

**Step 3: Run dev server and verify visually**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make dev`
Navigate to: `http://localhost:5173/settings/tools/cart-item-catalogs`
Expected: Page renders with header, table (possibly empty), Create button opens sheet

**Step 4: Commit**

```bash
git add src/routes/\(app\)/settings/tools/cart-item-catalogs/+page.svelte
git commit -m "feat(catalogs): implement cart item catalogs list page"
```

---

### Task 8: Catalog Detail Page

**Files:**
- Create: `src/routes/(app)/settings/tools/cart-item-catalogs/[catalogId]/+page.svelte`

**Step 1: Create the detail page**

This page loads catalog metadata + items, displays breadcrumb navigation, filter toolbar (SKU dropdown + search), items table, and an "Edit Catalog" button that opens the edit sheet.

```svelte
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
        <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
```

**Step 2: Run type check**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`

**Step 3: Run dev server and verify visually**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make dev`
Navigate to: `http://localhost:5173/settings/tools/cart-item-catalogs` then click a catalog name
Expected: Detail page shows breadcrumb, metadata, filter toolbar, items table

**Step 4: Commit**

```bash
git add src/routes/\(app\)/settings/tools/cart-item-catalogs/\[catalogId\]/+page.svelte
git commit -m "feat(catalogs): implement catalog detail page with items table"
```

---

### Task 9: E2E Tests

**Files:**
- Modify: `e2e/global-setup.ts` — add catalog seed data
- Modify: `e2e/test-state.ts` — add `catalogIds` to TestState
- Create: `e2e/tests/cart-item-catalogs.spec.ts`

**Step 1: Update test-state.ts to include catalogIds**

Add `catalogIds: number[]` to the `TestState` interface:

In `e2e/test-state.ts`, add `catalogIds: number[];` to the `TestState` interface after `collectionIds`.

**Step 2: Update global-setup.ts to seed catalogs**

In `e2e/global-setup.ts`, after the collection seeding block (before `saveTestState`), add:

```typescript
  // Create test catalogs
  const catalogConfigs = [
    {
      name: "E2E Test Catalog",
      description: "Catalog for E2E display tests",
      subscribedApplicationsIds: [app.id],
    },
    {
      name: "E2E Editable Catalog",
      description: "Catalog for edit/delete E2E tests",
      subscribedApplicationsIds: [app.id],
    },
  ];

  const catalogIds: number[] = [];
  for (const config of catalogConfigs) {
    const catRes = await apiPost(
      "/api/v1/catalogs",
      config,
      true, // ignore 409
    );
    if (catRes) {
      const cat = catRes.catalog;
      catalogIds.push(cat.id);
      console.log(`Created catalog: ${cat.name} (id=${cat.id})`);
    } else {
      console.log(`Catalog ${config.name} already exists, skipping`);
    }
  }
```

Also update the `saveTestState` call to include `catalogIds`.

**Step 3: Create the E2E test file**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Cart Item Catalogs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/tools/cart-item-catalogs");
    await expect(
      page.getByRole("heading", { name: "Cart Item Catalogs" })
    ).toBeVisible({ timeout: 15_000 });
    // Wait for at least one seeded catalog to appear
    await expect(
      page.getByRole("link", { name: "E2E Test Catalog" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should display the catalogs page with seeded data", async ({
    page,
  }) => {
    await expect(
      page.getByRole("link", { name: "E2E Test Catalog" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "E2E Editable Catalog" })
    ).toBeVisible();

    // Verify table columns
    const table = page.locator("table");
    await expect(table.getByText("Name")).toBeVisible();
    await expect(table.getByText("ID")).toBeVisible();
    await expect(table.getByText("Applications")).toBeVisible();
    await expect(table.getByText("Edit")).toBeVisible();
  });

  test("should create a new catalog", async ({ page }) => {
    await page.getByRole("button", { name: "Create Catalog" }).click();

    // Verify sheet description
    await expect(
      page.getByText("Edit the name, description, and connected Applications")
    ).toBeVisible();

    // Fill name
    const nameInput = page.getByRole("dialog").locator("input").first();
    await nameInput.fill("E2E Created Catalog");

    // Fill description
    const descTextarea = page.getByRole("dialog").locator("textarea");
    await descTextarea.fill("Created by E2E test");

    // Verify char counter
    await expect(page.getByText("19 / 200")).toBeVisible();

    // Submit
    await page.getByRole("button", { name: "Create Catalog" }).last().click();

    // Should appear in the table
    await expect(
      page.getByRole("link", { name: "E2E Created Catalog" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should navigate to catalog detail page", async ({ page }) => {
    await page.getByRole("link", { name: "E2E Test Catalog" }).click();

    // Verify breadcrumb
    await expect(page.getByText("Cart Item Catalogs")).toBeVisible();
    await expect(page.getByText("E2E Test Catalog")).toBeVisible();

    // Verify metadata
    await expect(page.getByText("Catalog Name")).toBeVisible();
    await expect(page.getByText("Catalog ID")).toBeVisible();
    await expect(page.getByText("Connected Applications")).toBeVisible();

    // Verify Edit Catalog button
    await expect(
      page.getByRole("button", { name: "Edit Catalog" })
    ).toBeVisible();
  });

  test("should open edit sheet from list page pencil icon", async ({
    page,
  }) => {
    // Click the pencil icon on the first row
    const firstEditButton = page.locator("table tbody tr").first().getByRole("button");
    await firstEditButton.click();

    await expect(
      page.getByText("Edit the name, description, and connected Applications")
    ).toBeVisible();

    // Cancel to close
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("should edit a catalog name and description", async ({ page }) => {
    // Open edit via pencil icon on "E2E Editable Catalog"
    const editableRow = page.locator("table tbody tr", {
      has: page.getByRole("link", { name: "E2E Editable Catalog" }),
    });
    await editableRow.getByRole("button").click();

    await expect(
      page.getByText("Edit the name, description, and connected Applications")
    ).toBeVisible();

    const updatePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/catalogs/") && req.method() === "PUT"
    );

    const nameInput = page.getByRole("dialog").locator("input").first();
    await nameInput.clear();
    await nameInput.fill("Updated Catalog");

    const descTextarea = page.getByRole("dialog").locator("textarea");
    await descTextarea.clear();
    await descTextarea.fill("Updated description");

    await page.getByRole("button", { name: "Save" }).click();

    const updateRequest = await updatePromise;
    const body = updateRequest.postDataJSON();
    expect(body.name).toBe("Updated Catalog");
    expect(body.description).toBe("Updated description");

    await expect(
      page.getByRole("link", { name: "Updated Catalog" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should delete a catalog", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Updated Catalog" })
    ).toBeVisible();

    const editableRow = page.locator("table tbody tr", {
      has: page.getByRole("link", { name: "Updated Catalog" }),
    });
    await editableRow.getByRole("button").click();

    await expect(
      page.getByText("Edit the name, description, and connected Applications")
    ).toBeVisible();

    const deletePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/catalogs/") && req.method() === "DELETE"
    );

    const sheetDeleteButton = page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete Catalog" });
    await sheetDeleteButton.scrollIntoViewIfNeeded();
    await sheetDeleteButton.click();

    const dialog = page.getByRole("dialog", { name: "Delete Catalog" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete Catalog" }).click();

    await deletePromise;
    await expect(dialog).toBeHidden({ timeout: 5_000 });
    await expect(
      page.getByRole("link", { name: "Updated Catalog" })
    ).toBeHidden({ timeout: 10_000 });
  });
});
```

**Step 4: Run type check**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`

**Step 5: Commit**

```bash
git add e2e/test-state.ts e2e/global-setup.ts e2e/tests/cart-item-catalogs.spec.ts
git commit -m "test(catalogs): add E2E tests and seed data for cart item catalogs"
```

---

### Task 10: Format and Final Verification

**Step 1: Run formatter**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make format`

**Step 2: Run type check**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`
Expected: No errors

**Step 3: Commit any formatting changes**

```bash
git add -A
git commit -m "style: format catalogs and generated files"
```
