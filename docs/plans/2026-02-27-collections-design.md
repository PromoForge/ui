# Collections Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Collections page for managing lists of items (SKUs, emails, etc.) used in promotion rules — with list view, create/edit sheets, CSV import/export, and E2E tests.

**Architecture:** Single-sheet with mode switching (create/edit), following the established Additional Costs page pattern exactly. Service layer wraps generated SDK. Svelte 5 rune-based store for state. Reuse applicationStore for Connected Applications dropdown.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), Tailwind CSS v4, shadcn-svelte (Bits UI), Playwright E2E tests, @hey-api generated SDK.

---

### Task 1: Create Collection Service

**Files:**
- Create: `src/lib/services/collectionService.ts`

**Step 1: Create the service file**

Follow the exact pattern from `src/lib/services/additionalCostService.ts`. Wrap generated SDK functions with error handling and return unwrapped data.

```typescript
import {
  backstageServiceListAccountCollections,
  backstageServiceCreateAccountCollection,
  backstageServiceUpdateAccountCollection,
  backstageServiceDeleteAccountCollection,
  backstageServiceImportAccountCollectionItems,
  backstageServiceExportAccountCollectionItems,
} from "$lib/api/generated";
import type {
  Collection,
  CreateAccountCollectionRequest,
  UpdateAccountCollectionRequest,
} from "$lib/api/generated/types.gen";

export async function listCollections(): Promise<{
  data: Collection[];
  total: number;
}> {
  const { data, error } = await backstageServiceListAccountCollections({
    query: { pageSize: 1000 },
  });
  if (error) {
    throw new Error("Failed to load collections");
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  };
}

export async function createCollection(
  request: CreateAccountCollectionRequest,
): Promise<Collection> {
  const { data, error } = await backstageServiceCreateAccountCollection({
    body: request,
  });
  if (error) {
    throw new Error("Failed to create collection");
  }
  return data!.collection!;
}

export async function updateCollection(
  collectionId: number,
  request: Omit<UpdateAccountCollectionRequest, "collectionId">,
): Promise<Collection> {
  const { data, error } = await backstageServiceUpdateAccountCollection({
    path: { collectionId },
    body: { ...request, collectionId },
  });
  if (error) {
    throw new Error("Failed to update collection");
  }
  return data!.collection!;
}

export async function deleteCollection(
  collectionId: number,
): Promise<void> {
  const { error } = await backstageServiceDeleteAccountCollection({
    path: { collectionId },
  });
  if (error) {
    throw new Error("Failed to delete collection");
  }
}

export async function importCollectionItems(
  collectionId: number,
  csvData: string,
): Promise<Collection> {
  const { data, error } = await backstageServiceImportAccountCollectionItems({
    path: { collectionId },
    body: { collectionId, csvData },
  });
  if (error) {
    throw new Error("Failed to import collection items");
  }
  return data!.collection!;
}

export async function exportCollectionItems(
  collectionId: number,
): Promise<string> {
  const { data, error } = await backstageServiceExportAccountCollectionItems({
    path: { collectionId },
  });
  if (error) {
    throw new Error("Failed to export collection items");
  }
  return data?.csvData ?? "";
}
```

**Step 2: Run type-check**

Run: `make check`
Expected: PASS — no type errors

**Step 3: Commit**

```bash
git add src/lib/services/collectionService.ts
git commit -m "feat(collections): add collection service layer"
```

---

### Task 2: Create Collection Store

**Files:**
- Create: `src/lib/stores/collectionStore.svelte.ts`

**Step 1: Create the store file**

Follow the exact pattern from `src/lib/stores/additionalCostStore.svelte.ts`. Use `$state()` and `$derived()` runes. Add import/export methods that the sheet will call.

```typescript
import {
  listCollections,
  createCollection as createCollectionApi,
  updateCollection as updateCollectionApi,
  deleteCollection as deleteCollectionApi,
  importCollectionItems as importCollectionItemsApi,
  exportCollectionItems as exportCollectionItemsApi,
} from "$lib/services/collectionService";
import type {
  Collection,
  CreateAccountCollectionRequest,
  UpdateAccountCollectionRequest,
} from "$lib/api/generated/types.gen";

function createCollectionStore() {
  let collections = $state<Collection[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state("");
  let currentPage = $state(1);
  let pageSize = $state(50);
  let createSheetOpen = $state(false);
  let editSheetOpen = $state(false);
  let editingCollection = $state<Collection | null>(null);

  const filteredCollections = $derived.by(() => {
    let result = collections;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name ?? "").toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q),
      );
    }

    return result;
  });

  const totalFiltered = $derived(filteredCollections.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)));
  const paginatedCollections = $derived(
    filteredCollections.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
  );

  async function loadCollections() {
    if (loading) return;
    loading = true;
    error = null;
    try {
      const result = await listCollections();
      collections = result.data;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load collections";
    } finally {
      loading = false;
    }
  }

  function setSearchQuery(query: string) {
    searchQuery = query;
    currentPage = 1;
  }

  function setPage(p: number) {
    currentPage = Math.max(1, Math.min(p, totalPages));
  }

  async function addCollection(
    request: CreateAccountCollectionRequest,
  ): Promise<Collection> {
    const collection = await createCollectionApi(request);
    collections = [collection, ...collections];
    return collection;
  }

  function openEditSheet(collection: Collection) {
    editingCollection = collection;
    editSheetOpen = true;
  }

  function closeEditSheet() {
    editSheetOpen = false;
    editingCollection = null;
  }

  async function modifyCollection(
    id: number,
    request: Omit<UpdateAccountCollectionRequest, "collectionId">,
  ): Promise<void> {
    const updated = await updateCollectionApi(id, request);
    collections = collections.map((c) =>
      c.id === updated.id ? updated : c,
    );
  }

  async function removeCollection(id: number): Promise<void> {
    await deleteCollectionApi(id);
    collections = collections.filter((c) => c.id !== id);
  }

  async function importItems(
    collectionId: number,
    csvData: string,
  ): Promise<void> {
    const updated = await importCollectionItemsApi(collectionId, csvData);
    collections = collections.map((c) =>
      c.id === updated.id ? updated : c,
    );
  }

  async function exportItems(collectionId: number): Promise<string> {
    return await exportCollectionItemsApi(collectionId);
  }

  return {
    get collections() {
      return collections;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get searchQuery() {
      return searchQuery;
    },
    get currentPage() {
      return currentPage;
    },
    get pageSize() {
      return pageSize;
    },
    get createSheetOpen() {
      return createSheetOpen;
    },
    set createSheetOpen(v: boolean) {
      createSheetOpen = v;
    },
    get editSheetOpen() {
      return editSheetOpen;
    },
    set editSheetOpen(v: boolean) {
      editSheetOpen = v;
    },
    get editingCollection() {
      return editingCollection;
    },
    get filteredCollections() {
      return filteredCollections;
    },
    get paginatedCollections() {
      return paginatedCollections;
    },
    get totalFiltered() {
      return totalFiltered;
    },
    get totalPages() {
      return totalPages;
    },
    loadCollections,
    setSearchQuery,
    setPage,
    addCollection,
    openEditSheet,
    closeEditSheet,
    modifyCollection,
    removeCollection,
    importItems,
    exportItems,
  };
}

export const collectionStore = createCollectionStore();
```

**Step 2: Run type-check**

Run: `make check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/stores/collectionStore.svelte.ts
git commit -m "feat(collections): add collection store with rune-based state"
```

---

### Task 3: Create CollectionTable Component

**Files:**
- Create: `src/lib/components/collections/CollectionTable.svelte`

**Step 1: Create the component**

Follow the pattern from `src/lib/components/additional-costs/AdditionalCostTable.svelte`. Columns: ID, NAME (name as clickable blue link + description subtitle), APPLICATIONS (grid icon + count). Reference screenshot #1 for exact layout.

```svelte
<script lang="ts">
  import type { Collection } from '$lib/api/generated/types.gen'
  import * as Table from '$lib/components/ui/table/index.js'
  import { LayoutGrid } from 'lucide-svelte'

  let {
    collections,
    onEdit,
  }: {
    collections: Collection[]
    onEdit?: (collection: Collection) => void
  } = $props()
</script>

<Table.Root>
  <Table.Header>
    <Table.Row class="border-b">
      <Table.Head class="w-16 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        ID
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Name
      </Table.Head>
      <Table.Head class="w-40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Applications
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each collections as collection (collection.id)}
      <Table.Row class="group hover:bg-muted/50">
        <Table.Cell class="text-sm text-muted-foreground">
          {collection.id}
        </Table.Cell>
        <Table.Cell>
          <div>
            <button
              class="text-sm font-medium text-primary hover:underline cursor-pointer"
              onclick={() => onEdit?.(collection)}
            >
              {collection.name ?? '—'}
            </button>
            {#if collection.description}
              <p class="text-sm text-muted-foreground mt-0.5">
                {collection.description}
              </p>
            {/if}
          </div>
        </Table.Cell>
        <Table.Cell>
          <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <LayoutGrid size={16} />
            {collection.subscribedApplicationsIds?.length ?? 0}
          </div>
        </Table.Cell>
      </Table.Row>
    {/each}

    {#if collections.length === 0}
      <Table.Row>
        <Table.Cell colspan={3} class="h-32 text-center text-muted-foreground">
          No collections found.
        </Table.Cell>
      </Table.Row>
    {/if}
  </Table.Body>
</Table.Root>
```

**Step 2: Run type-check**

Run: `make check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/components/collections/CollectionTable.svelte
git commit -m "feat(collections): add CollectionTable component"
```

---

### Task 4: Create CollectionSheet Component

**Files:**
- Create: `src/lib/components/collections/CollectionSheet.svelte`

**Step 1: Create the component**

This is the largest component. Follow the pattern from `src/lib/components/additional-costs/AdditionalCostSheet.svelte` (492 lines). Key differences from AdditionalCostSheet:
- No scope/API name fields — collections have just name + description
- Description uses `Textarea` instead of `Input`
- Has CSV import/export section (create: optional import; edit: manage items with export + import)
- Has "download a sample file" link that generates a CSV in-memory
- Warning banner in edit mode about replacing items

Reference:
- Screenshot #2 for create mode layout
- Screenshot #3 for edit mode layout
- Connected Applications pattern is identical to AdditionalCostSheet (Popover + Checkbox + removable chips)

```svelte
<script lang="ts">
  import type {
    Application,
    Collection,
    CreateAccountCollectionRequest,
    UpdateAccountCollectionRequest,
  } from '$lib/api/generated/types.gen'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { CircleHelp, Trash2, Upload, Download, TriangleAlert } from 'lucide-svelte'

  let {
    mode = 'create',
    collection = undefined,
    open = false,
    onOpenChange,
    onSubmit,
    onUpdate,
    onDelete,
    onImportItems,
    onExportItems,
    applications = [],
  }: {
    mode?: 'create' | 'edit'
    collection?: Collection
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit?: (request: CreateAccountCollectionRequest) => Promise<void>
    onUpdate?: (request: Omit<UpdateAccountCollectionRequest, 'collectionId'>) => Promise<void>
    onDelete?: (collectionId: number) => Promise<void>
    onImportItems?: (collectionId: number, csvData: string) => Promise<void>
    onExportItems?: (collectionId: number) => Promise<string>
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
  let importingCreate = $state(false)
  let createCsvData = $state<string | null>(null)
  let createCsvFileName = $state<string | null>(null)

  // Delete dialog state
  let deleteDialogOpen = $state(false)
  let deleting = $state(false)
  let deleteError = $state('')

  // Import state (edit mode)
  let importing = $state(false)
  let importError = $state('')
  let exporting = $state(false)

  // Validation
  const nameError = $derived(attempted && !name.trim() ? 'Name is required' : '')

  // Pre-populate form in edit mode
  $effect(() => {
    if (mode === 'edit' && collection && open) {
      name = collection.name ?? ''
      description = collection.description ?? ''
      selectedAppIds = collection.subscribedApplicationsIds
        ? [...collection.subscribedApplicationsIds]
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
    importingCreate = false
    createCsvData = null
    createCsvFileName = null
    importing = false
    importError = ''
    exporting = false
  }

  function handleCancel() {
    resetForm()
    onOpenChange(false)
  }

  function downloadSampleCsv() {
    const csv = 'item\nexample_sku_001\nexample_sku_002\nexample_sku_003\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'collection_sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleCreateCsvUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    importingCreate = true
    createCsvFileName = file.name
    const reader = new FileReader()
    reader.onload = () => {
      createCsvData = reader.result as string
      importingCreate = false
    }
    reader.onerror = () => {
      importingCreate = false
      createCsvData = null
      createCsvFileName = null
    }
    reader.readAsText(file)
    input.value = ''
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
        const request: CreateAccountCollectionRequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          subscribedApplicationsIds,
        }
        await onSubmit?.(request)

        // If CSV data was staged during create, import it after creation
        // The parent handler returns the created collection, but we need the ID.
        // We'll handle this via a callback pattern — the parent will chain the import.
      } else {
        const request: Omit<UpdateAccountCollectionRequest, 'collectionId'> = {
          name: name.trim(),
          description: description.trim() || undefined,
          subscribedApplicationsIds,
        }
        await onUpdate?.(request)
      }
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError =
        e instanceof Error
          ? e.message
          : mode === 'create'
            ? 'Failed to create collection'
            : 'Failed to update collection'
    } finally {
      submitting = false
    }
  }

  async function handleCsvUpload(event: Event) {
    if (!collection?.id) return
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    importing = true
    importError = ''
    try {
      const csvData = await file.text()
      await onImportItems?.(collection.id, csvData)
    } catch (e) {
      importError = e instanceof Error ? e.message : 'Failed to import items'
    } finally {
      importing = false
      input.value = ''
    }
  }

  async function handleExport() {
    if (!collection?.id) return
    exporting = true
    try {
      const csvData = await onExportItems?.(collection.id)
      if (csvData) {
        const blob = new Blob([csvData], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${collection.name ?? 'collection'}_items.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      exporting = false
    }
  }

  async function handleDelete() {
    if (!collection?.id) return
    deleting = true
    deleteError = ''
    try {
      await onDelete?.(collection.id)
      deleteDialogOpen = false
      resetForm()
      onOpenChange(false)
    } catch (e) {
      deleteError =
        e instanceof Error ? e.message : 'Failed to delete collection'
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
        {mode === 'edit' ? 'Edit Collection' : 'Create Collection'}
      </Sheet.Title>
      <Sheet.Description class="text-sm text-foreground">
        {#if mode === 'edit'}
          Edit the list of imported items that you can use in your rules. For example, a list of SKUs or email addresses to allow or block for a campaign.
        {:else}
          Create a list of items you can use in your rules. For example, a list of SKUs or email addresses to allow or block for a campaign.
        {/if}
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
      {#if submitError}
        <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      {/if}

      <!-- Name -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Name</Label>
        <Input
          value={name}
          oninput={(e: Event) => {
            name = (e.target as HTMLInputElement).value
          }}
          class={nameError ? 'border-destructive ring-destructive' : ''}
          placeholder=""
        />
        {#if nameError}
          <p class="text-xs text-destructive font-medium">{nameError}</p>
        {/if}
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Description (optional)</Label>
        <textarea
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          value={description}
          oninput={(e: Event) => {
            description = (e.target as HTMLTextAreaElement).value
          }}
        ></textarea>
      </div>

      <!-- Connected Applications -->
      <div class="space-y-2">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Connected Applications</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Select which applications can use this collection.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <Popover.Root bind:open={appDropdownOpen}>
          <Popover.Trigger
            class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <span class={selectedAppIds.length === 0 ? 'text-muted-foreground' : ''}>
              {selectedAppIds.length === 0
                ? 'Select Applications'
                : `${selectedAppIds.length} selected`}
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

        <!-- Selected apps as removable chips -->
        {#if selectedAppIds.length > 0}
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

      <!-- Import Items (create mode) -->
      {#if mode === 'create'}
        <Separator class="my-2" />
        <div class="space-y-2 pt-2">
          <h3 class="text-base font-medium">Import items (optional)</h3>
          <p class="text-sm text-muted-foreground">
            Upload a CSV file containing the items to import into your collection. To see the required structure, <button class="text-primary hover:underline cursor-pointer" onclick={downloadSampleCsv}>download a sample file</button>.
          </p>
          <div class="flex items-center gap-2">
            <label class="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer">
              <Upload size={14} />
              Upload a CSV File
              <input
                type="file"
                accept=".csv"
                class="hidden"
                onchange={handleCreateCsvUpload}
              />
            </label>
          </div>
          {#if createCsvFileName}
            <p class="text-sm text-muted-foreground">
              Selected: {createCsvFileName}
            </p>
          {/if}
        </div>
      {/if}

      <!-- Manage Items (edit mode) -->
      {#if mode === 'edit'}
        <Separator class="my-2" />
        <div class="space-y-3 pt-2">
          <h3 class="text-base font-medium">Manage items</h3>
          <div class="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            <TriangleAlert size={16} class="shrink-0" />
            Uploading a new list of items replaces the current list.
          </div>
          <p class="text-sm text-muted-foreground">
            Export a list of your collection items, or upload a new CSV file containing a maximum of 500,000 items to import into your collection. For reference, <button class="text-primary hover:underline cursor-pointer" onclick={downloadSampleCsv}>download a sample file</button>.
          </p>
          {#if importError}
            <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {importError}
            </div>
          {/if}
          <div class="flex items-center gap-2">
            <Button variant="outline" onclick={handleExport} disabled={exporting}>
              <Download size={14} class="mr-1.5" />
              {exporting ? 'Exporting...' : 'Export Items'}
            </Button>
            <label class="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer {importing ? 'opacity-50 pointer-events-none' : ''}">
              <Upload size={14} />
              {importing ? 'Uploading...' : 'Upload a CSV File'}
              <input
                type="file"
                accept=".csv"
                class="hidden"
                onchange={handleCsvUpload}
                disabled={importing}
              />
            </label>
          </div>
        </div>
      {/if}

      <!-- Delete Collection (edit mode only) -->
      {#if mode === 'edit'}
        <Separator class="my-2" />
        <div class="space-y-2 pt-2">
          <h3 class="text-base font-medium text-destructive">Delete collection</h3>
          <p class="text-sm text-muted-foreground">
            Deleting the collection also deletes its items. This action cannot be undone.
          </p>
          <Button
            variant="outline"
            class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
            onclick={() => (deleteDialogOpen = true)}
          >
            <Trash2 size={14} class="mr-1.5" />
            Delete Collection
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
          {mode === 'edit' ? 'Save' : 'Create Collection'}
        {/if}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>

<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete Collection</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete {collection?.name ?? 'this collection'}?
        This action is permanent and will also delete all items in the collection.
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
          Delete Collection
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

**Step 2: Run type-check**

Run: `make check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/components/collections/CollectionSheet.svelte
git commit -m "feat(collections): add CollectionSheet create/edit/delete component"
```

---

### Task 5: Update Collections Page

**Files:**
- Modify: `src/routes/(app)/settings/tools/collections/+page.svelte` (replace entire file)

**Step 1: Replace the placeholder page**

Follow the exact pattern from `src/routes/(app)/settings/tools/additional-costs/+page.svelte`. Wire up the store, table, sheets, search, and pagination.

```svelte
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
```

**Step 2: Run type-check**

Run: `make check`
Expected: PASS

**Step 3: Run dev server and visually verify**

Run: `make dev`
- Navigate to `/settings/tools/collections`
- Verify: page renders with header, search bar, empty table (if no data), and Create Collection button
- Verify: Create Collection button opens sheet with correct fields
- Verify: search input has correct placeholder

**Step 4: Commit**

```bash
git add src/routes/(app)/settings/tools/collections/+page.svelte
git commit -m "feat(collections): implement collections page with list, create/edit sheets"
```

---

### Task 6: Build Verification

**Step 1: Full type-check**

Run: `make check`
Expected: PASS — zero errors

**Step 2: Production build**

Run: `make build`
Expected: PASS — builds successfully

**Step 3: Format**

Run: `make format`

**Step 4: Commit any formatting changes**

```bash
git add -A
git commit -m "style: format collections files"
```

---

### Task 7: Seed E2E Test Data for Collections

**Files:**
- Modify: `e2e/global-setup.ts` — add collection seed data
- Modify: `e2e/test-state.ts` — add `collectionIds` to TestState

**Step 1: Add collectionIds to TestState**

In `e2e/test-state.ts`, add `collectionIds: number[]` to the `TestState` interface:

```typescript
export interface TestState {
  applicationId: number;
  applicationName: string;
  attributeIds: number[];
  additionalCostIds: number[];
  collectionIds: number[];
}
```

**Step 2: Add collection seeding to global-setup.ts**

After the additional costs seeding block (before `saveTestState`), add:

```typescript
  // Create test collections
  const collectionConfigs = [
    {
      name: "E2E Test Collection",
      description: "Collection for E2E display tests",
      subscribedApplicationsIds: [app.id],
    },
    {
      name: "E2E Editable Collection",
      description: "Collection for edit/delete E2E tests",
      subscribedApplicationsIds: [app.id],
    },
  ];

  const collectionIds: number[] = [];
  for (const config of collectionConfigs) {
    const colRes = await apiPost(
      "/api/v1/collections",
      config,
      true, // ignore 409
    );
    if (colRes) {
      const col = colRes.collection;
      collectionIds.push(col.id);
      console.log(`Created collection: ${col.name} (id=${col.id})`);
    } else {
      console.log(`Collection ${config.name} already exists, skipping`);
    }
  }
```

Update the `saveTestState` call to include `collectionIds`:

```typescript
  saveTestState({
    applicationId: app.id,
    applicationName: app.name,
    attributeIds,
    additionalCostIds,
    collectionIds,
  });
```

**Step 3: Run type-check**

Run: `cd e2e && npx tsc --noEmit` (or `make check`)
Expected: PASS

**Step 4: Commit**

```bash
git add e2e/global-setup.ts e2e/test-state.ts
git commit -m "test: add collection seed data for E2E tests"
```

---

### Task 8: Write E2E Tests

**Files:**
- Create: `e2e/tests/collections.spec.ts`

**Step 1: Create the E2E test file**

Follow the exact pattern from `e2e/tests/additional-costs.spec.ts`. Tests run serially (Playwright config has `workers: 1`), so later tests can depend on state from earlier ones. Hit the real API — no mocks.

```typescript
import { test, expect } from "@playwright/test";

test.describe("Collections", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/tools/collections");
    await expect(
      page.getByRole("heading", { name: "Collections" })
    ).toBeVisible({ timeout: 15_000 });
    // Wait for at least one seeded collection to appear
    await expect(
      page.getByRole("button", { name: "E2E Test Collection" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should display the collections page with seeded data", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "E2E Test Collection" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "E2E Editable Collection" })
    ).toBeVisible();

    // Verify table columns
    const table = page.locator("table");
    await expect(table.getByText("ID")).toBeVisible();
    await expect(table.getByText("Name")).toBeVisible();
    await expect(table.getByText("Applications")).toBeVisible();
  });

  test("should search collections by name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Name or Description");
    await searchInput.fill("Editable");

    await expect(
      page.getByRole("button", { name: "E2E Editable Collection" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "E2E Test Collection" })
    ).toBeHidden();

    await searchInput.clear();
    await expect(
      page.getByRole("button", { name: "E2E Test Collection" })
    ).toBeVisible();
  });

  test("should create a new collection", async ({ page }) => {
    await page
      .getByRole("button", { name: "Create Collection" })
      .click();

    // Verify sheet description
    await expect(
      page.getByText("Create a list of items you can use in your rules")
    ).toBeVisible();

    // Fill name
    const nameInput = page.getByRole("dialog").locator("input").first();
    await nameInput.fill("E2E Created Collection");

    // Fill description
    const descTextarea = page.getByRole("dialog").locator("textarea");
    await descTextarea.fill("Created by E2E test");

    // Submit
    await page
      .getByRole("button", { name: "Create Collection" })
      .last()
      .click();

    // Should appear in the table
    await expect(
      page.getByRole("button", { name: "E2E Created Collection" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should open edit sheet with pre-populated data when clicking name", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "E2E Editable Collection" })
      .click();

    await expect(
      page.getByText("Edit the list of imported items")
    ).toBeVisible();

    // Verify name is pre-populated
    const nameInput = page.getByRole("dialog").locator("input").first();
    await expect(nameInput).toHaveValue("E2E Editable Collection");

    // Verify description is pre-populated
    const descTextarea = page.getByRole("dialog").locator("textarea");
    await expect(descTextarea).toHaveValue(
      "Collection for edit/delete E2E tests"
    );

    // Verify manage items section exists
    await expect(page.getByText("Manage items")).toBeVisible();
    await expect(
      page.getByText("Uploading a new list of items replaces the current list")
    ).toBeVisible();

    // Verify delete section exists
    await expect(page.getByText("Delete collection")).toBeVisible();

    // Cancel to close
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("should edit a collection name and description", async ({ page }) => {
    await page
      .getByRole("button", { name: "E2E Editable Collection" })
      .click();

    await expect(
      page.getByText("Edit the list of imported items")
    ).toBeVisible();

    const updatePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/collections/") &&
        req.method() === "PUT"
    );

    const nameInput = page.getByRole("dialog").locator("input").first();
    await nameInput.clear();
    await nameInput.fill("Updated Collection");

    const descTextarea = page.getByRole("dialog").locator("textarea");
    await descTextarea.clear();
    await descTextarea.fill("Updated description");

    await page.getByRole("button", { name: "Save" }).click();

    const updateRequest = await updatePromise;
    const body = updateRequest.postDataJSON();
    expect(body.name).toBe("Updated Collection");
    expect(body.description).toBe("Updated description");

    await expect(
      page.getByRole("button", { name: "Updated Collection" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should show delete confirmation and cancel it", async ({ page }) => {
    await page
      .getByRole("button", { name: "Updated Collection" })
      .click();

    await expect(
      page.getByText("Edit the list of imported items")
    ).toBeVisible();

    const sheetDeleteButton = page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete Collection" });
    await sheetDeleteButton.scrollIntoViewIfNeeded();
    await sheetDeleteButton.click();

    const dialog = page.getByRole("dialog", {
      name: "Delete Collection",
    });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();

    // Close the edit sheet
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("should delete a collection", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Updated Collection" })
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Updated Collection" })
      .click();

    await expect(
      page.getByText("Edit the list of imported items")
    ).toBeVisible();

    const deletePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/collections/") &&
        req.method() === "DELETE"
    );

    const sheetDeleteButton = page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete Collection" });
    await sheetDeleteButton.scrollIntoViewIfNeeded();
    await sheetDeleteButton.click();

    const dialog = page.getByRole("dialog", {
      name: "Delete Collection",
    });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "Delete Collection" })
      .click();

    await deletePromise;
    await expect(dialog).toBeHidden({ timeout: 5_000 });
    await expect(
      page.getByRole("button", { name: "Updated Collection" })
    ).toBeHidden({ timeout: 10_000 });
  });
});
```

**Step 2: Commit**

```bash
git add e2e/tests/collections.spec.ts
git commit -m "test: add E2E tests for collections page"
```

---

### Task 9: Run E2E Tests

**Step 1: Run full E2E suite**

Run: `make test-e2e`
Expected: All tests pass including the new collections tests.

**Step 2: If tests fail, debug and fix**

- Check test output for specific failure messages
- Adjust selectors if elements aren't found (check for portaled content / Bits UI gotchas per CLAUDE.md)
- Re-run after fixes

**Step 3: Commit any test fixes**

```bash
git add -A
git commit -m "fix: resolve E2E test issues for collections"
```

---

## File Summary

| File | Action |
|------|--------|
| `src/lib/services/collectionService.ts` | CREATE |
| `src/lib/stores/collectionStore.svelte.ts` | CREATE |
| `src/lib/components/collections/CollectionTable.svelte` | CREATE |
| `src/lib/components/collections/CollectionSheet.svelte` | CREATE |
| `src/routes/(app)/settings/tools/collections/+page.svelte` | REPLACE |
| `e2e/test-state.ts` | MODIFY |
| `e2e/global-setup.ts` | MODIFY |
| `e2e/tests/collections.spec.ts` | CREATE |
