# Additional Costs Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full CRUD page for managing additional costs (shipping fees, etc.) that follows the existing attributes page pattern.

**Architecture:** Service layer wraps generated SDK → Svelte 5 rune-based store manages state → Page component composes table + sheet components. Sheet handles both create and edit modes. Delete lives inside the edit sheet's danger zone.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, shadcn-svelte (Sheet, Table, Dialog, Popover, Checkbox, Input, Button, Badge, Tooltip, Separator, Label), TypeScript, Playwright E2E tests.

---

### Task 1: Create the service layer

**Files:**
- Create: `src/lib/services/additionalCostService.ts`

**Step 1: Create the service file**

```typescript
// src/lib/services/additionalCostService.ts
import {
  backstageServiceListAdditionalCosts,
  backstageServiceCreateAdditionalCost,
  backstageServiceUpdateAdditionalCost,
  backstageServiceDeleteAdditionalCost,
} from "$lib/api/generated";
import type {
  AdditionalCost,
  CreateAdditionalCostRequest,
  UpdateAdditionalCostRequest,
} from "$lib/api/generated/types.gen";

export async function listAdditionalCosts(): Promise<{
  data: AdditionalCost[];
  total: number;
}> {
  const { data, error } = await backstageServiceListAdditionalCosts({
    query: { pageSize: 1000 },
  });
  if (error) {
    throw new Error("Failed to load additional costs");
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  };
}

export async function createAdditionalCost(
  request: CreateAdditionalCostRequest,
): Promise<AdditionalCost> {
  const { data, error } = await backstageServiceCreateAdditionalCost({
    body: request,
  });
  if (error) {
    throw new Error("Failed to create additional cost");
  }
  return data!.additionalCost!;
}

export async function updateAdditionalCost(
  additionalCostId: number,
  request: Omit<UpdateAdditionalCostRequest, "additionalCostId">,
): Promise<AdditionalCost> {
  const { data, error } = await backstageServiceUpdateAdditionalCost({
    path: { additionalCostId },
    body: { ...request, additionalCostId },
  });
  if (error) {
    throw new Error("Failed to update additional cost");
  }
  return data!.additionalCost!;
}

export async function deleteAdditionalCost(
  additionalCostId: number,
): Promise<void> {
  const { error } = await backstageServiceDeleteAdditionalCost({
    path: { additionalCostId },
  });
  if (error) {
    throw new Error("Failed to delete additional cost");
  }
}
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors related to additionalCostService.ts

**Step 3: Commit**

```bash
git add src/lib/services/additionalCostService.ts
git commit -m "feat: add additional cost service layer"
```

---

### Task 2: Create the store

**Files:**
- Create: `src/lib/stores/additionalCostStore.svelte.ts`

**Step 1: Create the store file**

Follow the exact same pattern as `attributeStore.svelte.ts` but simplified (no tabs, no filters, no sort — just search + pagination).

```typescript
// src/lib/stores/additionalCostStore.svelte.ts
import {
  listAdditionalCosts,
  createAdditionalCost as createAdditionalCostApi,
  updateAdditionalCost as updateAdditionalCostApi,
  deleteAdditionalCost as deleteAdditionalCostApi,
} from "$lib/services/additionalCostService";
import type {
  AdditionalCost,
  CreateAdditionalCostRequest,
  UpdateAdditionalCostRequest,
} from "$lib/api/generated/types.gen";

export const SCOPE_LABELS: Record<string, string> = {
  ADDITIONAL_COST_TYPE_SESSION: "Cart (Session)",
  ADDITIONAL_COST_TYPE_ITEM: "Item",
  ADDITIONAL_COST_TYPE_BOTH: "Cart (Session) & Item",
};

function createAdditionalCostStore() {
  let additionalCosts = $state<AdditionalCost[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state("");
  let currentPage = $state(1);
  let pageSize = $state(50);
  let createSheetOpen = $state(false);
  let editSheetOpen = $state(false);
  let editingCost = $state<AdditionalCost | null>(null);

  const filteredCosts = $derived.by(() => {
    let result = additionalCosts;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.title ?? "").toLowerCase().includes(q) ||
          (c.name ?? "").toLowerCase().includes(q),
      );
    }

    return result;
  });

  const totalFiltered = $derived(filteredCosts.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)));
  const paginatedCosts = $derived(
    filteredCosts.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
  );

  async function loadAdditionalCosts() {
    if (loading) return;
    loading = true;
    error = null;
    try {
      const result = await listAdditionalCosts();
      additionalCosts = result.data;
    } catch (e) {
      error =
        e instanceof Error ? e.message : "Failed to load additional costs";
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

  async function createCost(
    request: CreateAdditionalCostRequest,
  ): Promise<AdditionalCost> {
    const cost = await createAdditionalCostApi(request);
    additionalCosts = [cost, ...additionalCosts];
    return cost;
  }

  function openEditSheet(cost: AdditionalCost) {
    editingCost = cost;
    editSheetOpen = true;
  }

  function closeEditSheet() {
    editSheetOpen = false;
    editingCost = null;
  }

  async function updateCost(
    id: number,
    request: Omit<UpdateAdditionalCostRequest, "additionalCostId">,
  ): Promise<void> {
    const updated = await updateAdditionalCostApi(id, request);
    additionalCosts = additionalCosts.map((c) =>
      c.id === updated.id ? updated : c,
    );
  }

  async function removeCost(id: number): Promise<void> {
    await deleteAdditionalCostApi(id);
    additionalCosts = additionalCosts.filter((c) => c.id !== id);
  }

  return {
    get additionalCosts() {
      return additionalCosts;
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
    get editingCost() {
      return editingCost;
    },
    get filteredCosts() {
      return filteredCosts;
    },
    get paginatedCosts() {
      return paginatedCosts;
    },
    get totalFiltered() {
      return totalFiltered;
    },
    get totalPages() {
      return totalPages;
    },
    loadAdditionalCosts,
    setSearchQuery,
    setPage,
    createCost,
    openEditSheet,
    closeEditSheet,
    updateCost,
    removeCost,
  };
}

export const additionalCostStore = createAdditionalCostStore();
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors related to additionalCostStore.svelte.ts

**Step 3: Commit**

```bash
git add src/lib/stores/additionalCostStore.svelte.ts
git commit -m "feat: add additional cost store"
```

---

### Task 3: Create the table component

**Files:**
- Create: `src/lib/components/additional-costs/AdditionalCostTable.svelte`

**Step 1: Create the component**

Follow `AttributeTable.svelte` pattern. Columns: Title (clickable), API Name, Scope (badges), Description.

```svelte
<!-- src/lib/components/additional-costs/AdditionalCostTable.svelte -->
<script lang="ts">
  import type { AdditionalCost } from '$lib/api/generated/types.gen'
  import * as Table from '$lib/components/ui/table/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'

  let {
    costs,
    onEdit
  }: {
    costs: AdditionalCost[]
    onEdit?: (cost: AdditionalCost) => void
  } = $props()

  function scopeBadges(type?: string): { label: string; variant: 'default' | 'secondary' }[] {
    switch (type) {
      case 'ADDITIONAL_COST_TYPE_SESSION':
        return [{ label: 'Cart (Session)', variant: 'secondary' }]
      case 'ADDITIONAL_COST_TYPE_ITEM':
        return [{ label: 'Item', variant: 'secondary' }]
      case 'ADDITIONAL_COST_TYPE_BOTH':
        return [
          { label: 'Cart (Session)', variant: 'secondary' },
          { label: 'Item', variant: 'secondary' }
        ]
      default:
        return [{ label: 'Cart (Session)', variant: 'secondary' }]
    }
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row class="border-b">
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Title
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        API Name
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Scope
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Description
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each costs as cost (cost.id)}
      <Table.Row class="group hover:bg-muted/50">
        <Table.Cell>
          <button
            class="text-sm font-medium text-primary hover:underline cursor-pointer"
            onclick={() => onEdit?.(cost)}
          >
            {cost.title ?? cost.name ?? '—'}
          </button>
        </Table.Cell>
        <Table.Cell class="font-mono text-sm text-muted-foreground">
          {cost.name ?? '—'}
        </Table.Cell>
        <Table.Cell>
          <div class="flex items-center gap-1.5">
            {#each scopeBadges(cost.type) as badge (badge.label)}
              <Badge variant={badge.variant}>{badge.label}</Badge>
            {/each}
          </div>
        </Table.Cell>
        <Table.Cell class="text-sm text-muted-foreground max-w-xs truncate">
          {cost.description ?? '—'}
        </Table.Cell>
      </Table.Row>
    {/each}

    {#if costs.length === 0}
      <Table.Row>
        <Table.Cell colspan={4} class="h-32 text-center text-muted-foreground">
          No additional costs found.
        </Table.Cell>
      </Table.Row>
    {/if}
  </Table.Body>
</Table.Root>
```

**Step 2: Verify no type errors**

Run: `make check`

**Step 3: Commit**

```bash
git add src/lib/components/additional-costs/AdditionalCostTable.svelte
git commit -m "feat: add AdditionalCostTable component"
```

---

### Task 4: Create the sheet component (create + edit + delete)

**Files:**
- Create: `src/lib/components/additional-costs/AdditionalCostSheet.svelte`

**Step 1: Create the component**

This is the most complex component. It handles create and edit modes. The form has: Scope checkboxes, API Name (auto-slug in create, read-only in edit), Rule Builder Name (title, 20 char max), Rule Builder Description, Connected Applications multi-select. Edit mode adds a danger zone with delete.

```svelte
<!-- src/lib/components/additional-costs/AdditionalCostSheet.svelte -->
<script lang="ts">
  import type {
    Application,
    AdditionalCost,
    CreateAdditionalCostRequest,
    UpdateAdditionalCostRequest,
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
  import { CircleHelp, Trash2 } from 'lucide-svelte'

  let {
    mode = 'create',
    cost = undefined,
    open = false,
    onOpenChange,
    onSubmit,
    onUpdate,
    onDelete,
    applications = [],
  }: {
    mode?: 'create' | 'edit'
    cost?: AdditionalCost
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit?: (request: CreateAdditionalCostRequest) => Promise<void>
    onUpdate?: (request: Omit<UpdateAdditionalCostRequest, 'additionalCostId'>) => Promise<void>
    onDelete?: (additionalCostId: number) => Promise<void>
    applications: Application[]
  } = $props()

  // Form state
  let scopeSession = $state(true)
  let scopeItem = $state(false)
  let apiName = $state('')
  let title = $state('')
  let description = $state('')
  let selectedAppIds = $state<number[]>([])
  let appDropdownOpen = $state(false)
  let submitting = $state(false)
  let attempted = $state(false)
  let apiNameManuallyEdited = $state(false)
  let submitError = $state('')

  // Delete dialog state
  let deleteDialogOpen = $state(false)
  let deleting = $state(false)
  let deleteError = $state('')

  // Derive the cost type from checkboxes
  function getCostType(): CreateAdditionalCostRequest['type'] {
    if (scopeSession && scopeItem) return 'ADDITIONAL_COST_TYPE_BOTH'
    if (scopeItem) return 'ADDITIONAL_COST_TYPE_ITEM'
    return 'ADDITIONAL_COST_TYPE_SESSION'
  }

  // Validation
  const scopeError = $derived(attempted && !scopeSession && !scopeItem ? 'Select at least one scope' : '')
  const apiNameError = $derived(
    attempted && !apiName
      ? 'Required'
      : apiName && !/^[a-zA-Z0-9_]+$/.test(apiName)
        ? 'Only letters, numbers, and underscores'
        : '',
  )

  // Auto-slug generation from title
  $effect(() => {
    if (!apiNameManuallyEdited && title) {
      apiName = title
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
    }
  })

  // Pre-populate form in edit mode
  $effect(() => {
    if (mode === 'edit' && cost && open) {
      const costType = cost.type ?? 'ADDITIONAL_COST_TYPE_SESSION'
      scopeSession =
        costType === 'ADDITIONAL_COST_TYPE_SESSION' ||
        costType === 'ADDITIONAL_COST_TYPE_BOTH'
      scopeItem =
        costType === 'ADDITIONAL_COST_TYPE_ITEM' ||
        costType === 'ADDITIONAL_COST_TYPE_BOTH'
      apiName = cost.name ?? ''
      title = cost.title ?? ''
      description = cost.description ?? ''
      selectedAppIds = cost.subscribedApplicationsIds
        ? [...cost.subscribedApplicationsIds]
        : []
      apiNameManuallyEdited = true
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
    scopeSession = true
    scopeItem = false
    apiName = ''
    title = ''
    description = ''
    selectedAppIds = []
    appDropdownOpen = false
    submitting = false
    attempted = false
    apiNameManuallyEdited = false
    submitError = ''
  }

  function handleCancel() {
    resetForm()
    onOpenChange(false)
  }

  async function handleSubmit() {
    attempted = true
    submitError = ''

    if (!scopeSession && !scopeItem) return
    if (!apiName || !/^[a-zA-Z0-9_]+$/.test(apiName)) return

    submitting = true
    try {
      const subscribedApplicationsIds =
        selectedAppIds.length > 0 ? selectedAppIds : undefined

      if (mode === 'create') {
        const request: CreateAdditionalCostRequest = {
          name: apiName,
          title: title || undefined,
          description: description || undefined,
          type: getCostType(),
          subscribedApplicationsIds,
        }
        await onSubmit?.(request)
      } else {
        const request: Omit<UpdateAdditionalCostRequest, 'additionalCostId'> = {
          title: title || undefined,
          description: description || undefined,
          type: getCostType(),
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
            ? 'Failed to create additional cost'
            : 'Failed to update additional cost'
    } finally {
      submitting = false
    }
  }

  async function handleDelete() {
    if (!cost?.id) return
    deleting = true
    deleteError = ''
    try {
      await onDelete?.(cost.id)
      deleteDialogOpen = false
      resetForm()
      onOpenChange(false)
    } catch (e) {
      deleteError =
        e instanceof Error ? e.message : 'Failed to delete additional cost'
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
      <Sheet.Title>
        {mode === 'edit' ? 'Edit Additional Cost' : 'Create Additional Cost'}
      </Sheet.Title>
      <Sheet.Description class="text-sm text-foreground">
        An additional cost represents an added fee, such as a shipping fee. A cost has a scope
        describing whether the cost applies to the cart (session) or a given item.
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
      {#if submitError}
        <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      {/if}

      <!-- Scope -->
      <div class="space-y-2">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Scope</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Whether this cost applies to the cart session, individual items, or both.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <div class="flex items-center gap-6">
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={scopeSession}
              onCheckedChange={(v) => (scopeSession = !!v)}
            />
            Cart (Session)
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={scopeItem}
              onCheckedChange={(v) => (scopeItem = !!v)}
            />
            Item
          </label>
        </div>
        {#if scopeError}
          <p class="text-xs text-destructive font-medium">{scopeError}</p>
        {/if}
      </div>

      <!-- API Name -->
      {#if mode === 'edit'}
        <div class="space-y-1.5">
          <div class="flex items-center gap-1.5">
            <Label class="text-sm font-medium">API name</Label>
            <Tooltip.Root>
              <Tooltip.Trigger>
                <CircleHelp size={14} class="text-muted-foreground" />
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>The machine-readable identifier. Cannot be changed after creation.</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </div>
          <div class="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-mono text-muted-foreground">
            {apiName}
          </div>
        </div>
      {:else}
        <div class="space-y-1.5">
          <div class="flex items-center gap-1.5">
            <Label class="text-sm font-medium">API name</Label>
            <Tooltip.Root>
              <Tooltip.Trigger>
                <CircleHelp size={14} class="text-muted-foreground" />
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>The machine-readable identifier. Alphanumeric and underscores only.</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </div>
          <Input
            value={apiName}
            oninput={(e: Event) => {
              apiName = (e.target as HTMLInputElement).value
              apiNameManuallyEdited = true
            }}
            class={apiNameError ? 'border-destructive ring-destructive' : ''}
            placeholder="e.g. shipping_cost"
          />
          {#if apiNameError}
            <p class="text-xs text-destructive font-medium">{apiNameError}</p>
          {/if}
        </div>
      {/if}

      <!-- Rule Builder name (title) -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Rule Builder name</Label>
        <div class="relative">
          <Input
            value={title}
            oninput={(e: Event) => {
              const val = (e.target as HTMLInputElement).value
              if (val.length <= 20) title = val
            }}
            maxlength={20}
            placeholder="e.g. Shipping Cost"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {title.length} / 20
          </span>
        </div>
      </div>

      <!-- Rule Builder description -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Rule Builder description</Label>
        <Input
          value={description}
          oninput={(e: Event) => {
            description = (e.target as HTMLInputElement).value
          }}
          placeholder="e.g. Delivery charges for the purchase."
        />
      </div>

      <!-- Connected Applications -->
      <div class="space-y-2 pt-2">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Connected Applications</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Select which applications can use this cost. Leave empty for all.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <Popover.Root bind:open={appDropdownOpen}>
          <Popover.Trigger
            class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <span class={selectedAppIds.length === 0 ? 'text-muted-foreground' : ''}>
              {selectedAppIds.length === 0
                ? 'All Applications'
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

      <!-- Delete Additional Cost (edit mode only) -->
      {#if mode === 'edit'}
        <Separator class="my-2" />
        <div class="space-y-2 pt-2">
          <h3 class="text-base font-medium">Delete Additional Cost</h3>
          <p class="text-sm text-muted-foreground">
            Are you sure you want to delete this additional cost? Ensure your integration does not
            rely on this additional cost before deleting it.
          </p>
          <Button
            variant="outline"
            class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
            onclick={() => (deleteDialogOpen = true)}
          >
            <Trash2 size={14} class="mr-1.5" />
            Delete Additional Cost
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
          {mode === 'edit' ? 'Save' : 'Create Additional Cost'}
        {/if}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>

<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete Additional Cost</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete {cost?.title ?? cost?.name ?? 'this additional cost'}?
        This action is permanent.
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
          Delete Additional Cost
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

**Step 2: Verify no type errors**

Run: `make check`

**Step 3: Commit**

```bash
git add src/lib/components/additional-costs/AdditionalCostSheet.svelte
git commit -m "feat: add AdditionalCostSheet create/edit/delete component"
```

---

### Task 5: Create the page route

**Files:**
- Create: `src/routes/(app)/settings/tools/additional-costs/+page.svelte`

**Step 1: Create the page**

Follow the attributes page pattern exactly.

```svelte
<!-- src/routes/(app)/settings/tools/additional-costs/+page.svelte -->
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
```

**Step 2: Verify no type errors**

Run: `make check`

**Step 3: Verify the page renders**

Run: `make dev` and navigate to `http://localhost:5173/settings/tools/additional-costs`
Expected: Page renders with "Additional Costs" heading, search bar, empty table, and "Create Additional Cost" button.

**Step 4: Commit**

```bash
git add src/routes/\(app\)/settings/tools/additional-costs/+page.svelte
git commit -m "feat: add additional costs page route"
```

---

### Task 6: Seed E2E test data and write tests

**Files:**
- Modify: `e2e/global-setup.ts` — add additional cost seed data
- Modify: `e2e/test-state.ts` — add additionalCostIds to TestState
- Create: `e2e/tests/additional-costs.spec.ts`

**Step 1: Update test-state.ts to include additionalCostIds**

Add `additionalCostIds: number[]` to the `TestState` interface:

```typescript
export interface TestState {
  applicationId: number;
  applicationName: string;
  attributeIds: number[];
  additionalCostIds: number[];
}
```

**Step 2: Add seed data to global-setup.ts**

After the attribute seeding section (before `saveTestState`), add:

```typescript
  // Create test additional costs
  const additionalCostConfigs = [
    {
      name: "e2e_shipping_cost",
      title: "Shipping Cost",
      description: "Delivery charges for the purchase.",
      type: "ADDITIONAL_COST_TYPE_SESSION",
      subscribedApplicationsIds: [app.id],
    },
    {
      name: "e2e_extra_fees",
      title: "Extra Fees",
      description: "Extra fees applied to order.",
      type: "ADDITIONAL_COST_TYPE_ITEM",
    },
    {
      name: "e2e_editable_cost",
      title: "Editable Cost",
      description: "Cost for edit/delete E2E tests",
      type: "ADDITIONAL_COST_TYPE_BOTH",
      subscribedApplicationsIds: [app.id],
    },
  ];

  const additionalCostIds: number[] = [];
  for (const config of additionalCostConfigs) {
    const costRes = await apiPost(
      "/api/v1/additional_costs",
      config,
      true, // ignore 409
    );
    if (costRes) {
      const costObj = costRes.additionalCost;
      additionalCostIds.push(costObj.id);
      console.log(`Created additional cost: ${costObj.title} (id=${costObj.id})`);
    } else {
      console.log(`Additional cost ${config.title} already exists, skipping`);
    }
  }
```

Update `saveTestState` to include:

```typescript
  saveTestState({
    applicationId: app.id,
    applicationName: app.name,
    attributeIds,
    additionalCostIds,
  });
```

**Step 3: Create the E2E test file**

```typescript
// e2e/tests/additional-costs.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Additional Costs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/tools/additional-costs");
    await expect(
      page.getByRole("heading", { name: "Additional Costs" })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Shipping Cost")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should display the additional costs page with seeded data", async ({
    page,
  }) => {
    await expect(page.getByText("Shipping Cost")).toBeVisible();
    await expect(page.getByText("Extra Fees")).toBeVisible();
    await expect(page.getByText("Editable Cost")).toBeVisible();

    // Verify scope badges
    await expect(page.getByText("Cart (Session)").first()).toBeVisible();
    await expect(page.getByText("Item").first()).toBeVisible();
  });

  test("should search additional costs by name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search");
    await searchInput.fill("Shipping");

    await expect(page.getByText("Shipping Cost")).toBeVisible();
    await expect(page.getByText("Extra Fees")).toBeHidden();

    await searchInput.clear();
    await expect(page.getByText("Extra Fees")).toBeVisible();
  });

  test("should create a new additional cost", async ({ page }) => {
    await page
      .getByRole("button", { name: "Create Additional Cost" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Create Additional Cost" })
    ).toBeVisible();

    // API name
    await page
      .getByPlaceholder("e.g. shipping_cost")
      .fill("e2e_created_cost");

    // Rule Builder name
    await page
      .getByPlaceholder("e.g. Shipping Cost")
      .fill("E2E Created Cost");

    // Rule Builder description
    await page
      .getByPlaceholder("e.g. Delivery charges for the purchase.")
      .fill("Cost created by E2E test");

    // Submit
    await page
      .getByRole("button", { name: "Create Additional Cost" })
      .last()
      .click();

    // Should appear in the table
    await expect(page.getByText("E2E Created Cost")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should open edit sheet with pre-populated data when clicking title", async ({
    page,
  }) => {
    // Click the title link to open edit sheet
    await page.getByRole("button", { name: "Editable Cost" }).click();

    await expect(
      page.getByRole("heading", { name: "Edit Additional Cost" })
    ).toBeVisible();

    // Verify read-only API name
    const sheet = page.getByLabel("Edit Additional Cost");
    await expect(
      sheet
        .locator(".bg-muted\\/50")
        .filter({ hasText: "e2e_editable_cost" })
    ).toBeVisible();

    // Verify editable fields are pre-populated
    await expect(page.getByPlaceholder("e.g. Shipping Cost")).toHaveValue(
      "Editable Cost"
    );
    await expect(
      page.getByPlaceholder("e.g. Delivery charges for the purchase.")
    ).toHaveValue("Cost for edit/delete E2E tests");

    // Cancel to close
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("should edit additional cost name and description", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Editable Cost" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Additional Cost" })
    ).toBeVisible();

    const updatePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/additional_costs/") &&
        req.method() === "PUT"
    );

    const nameInput = page.getByPlaceholder("e.g. Shipping Cost");
    await nameInput.clear();
    await nameInput.fill("Updated Cost");

    const descInput = page.getByPlaceholder(
      "e.g. Delivery charges for the purchase."
    );
    await descInput.clear();
    await descInput.fill("Updated description");

    await page.getByRole("button", { name: "Save" }).click();

    const updateRequest = await updatePromise;
    const body = updateRequest.postDataJSON();
    expect(body.title).toBe("Updated Cost");
    expect(body.description).toBe("Updated description");

    await expect(page.getByText("Updated Cost")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should show delete confirmation and cancel it", async ({ page }) => {
    await page.getByRole("button", { name: "Updated Cost" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Additional Cost" })
    ).toBeVisible();

    const deleteButton = page
      .getByRole("button", { name: "Delete Additional Cost" })
      .first();
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();

    const dialog = page
      .locator("[role='alertdialog'], [role='dialog']")
      .filter({ hasText: "Are you sure" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Edit Additional Cost" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("should delete an additional cost", async ({ page }) => {
    await expect(page.getByText("Updated Cost")).toBeVisible();

    await page.getByRole("button", { name: "Updated Cost" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Additional Cost" })
    ).toBeVisible();

    const deletePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/additional_costs/") &&
        req.method() === "DELETE"
    );

    const deleteButton = page
      .getByRole("button", { name: "Delete Additional Cost" })
      .first();
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();

    const dialog = page
      .locator("[role='alertdialog'], [role='dialog']")
      .filter({ hasText: "Are you sure" });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "Delete Additional Cost" })
      .click();

    await deletePromise;
    await expect(dialog).toBeHidden({ timeout: 5_000 });
    await expect(page.getByText("Updated Cost")).toBeHidden({
      timeout: 10_000,
    });
  });
});
```

**Step 4: Commit**

```bash
git add e2e/test-state.ts e2e/global-setup.ts e2e/tests/additional-costs.spec.ts
git commit -m "test: add E2E tests for additional costs page"
```

---

### Task 7: Run E2E tests and fix any issues

**Step 1: Run the full E2E suite**

Run: `make test-e2e`
Expected: All tests pass, including the new additional costs tests.

**Step 2: Fix any failures**

If tests fail, diagnose and fix. Common issues:
- Selector mismatches (check exact text, roles)
- Timing issues (add `timeout` to assertions)
- Portal event delegation (use `evaluate((el) => el.click())` if needed)

**Step 3: Commit fixes if any**

```bash
git add -A
git commit -m "fix: resolve E2E test issues for additional costs"
```
