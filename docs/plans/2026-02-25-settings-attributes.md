# Settings Page & Attributes Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the settings page with a Talon.one-style sidebar and build a fully functional Attributes management page with filter/sort dropdowns and a create attribute sheet.

**Architecture:** File-based SvelteKit routing with a `settings/+layout.svelte` providing a dedicated settings sidebar. Attributes page uses a Svelte 5 rune store for client-side filtering/sorting/pagination, a thin service layer over the generated hey-api SDK, and modular components for table, filter, sort, and create form.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), Tailwind CSS v4, shadcn-svelte (Bits UI), TypeScript, lucide-svelte icons, hey-api generated SDK.

**Design Doc:** `docs/plans/2026-02-25-settings-attributes-design.md`

---

## Task 1: Install Missing shadcn-svelte Components

We need `tabs`, `popover`, `checkbox`, and `collapsible` — none of which are currently installed.

**Step 1: Install components**

```bash
bunx shadcn-svelte@latest add tabs popover checkbox collapsible
```

Accept all defaults. This creates:
- `src/lib/components/ui/tabs/`
- `src/lib/components/ui/popover/`
- `src/lib/components/ui/checkbox/`
- `src/lib/components/ui/collapsible/`

**Step 2: Verify installation**

```bash
ls src/lib/components/ui/tabs/ src/lib/components/ui/popover/ src/lib/components/ui/checkbox/ src/lib/components/ui/collapsible/
```

Expected: Each directory has `.svelte` files and an `index.ts`.

**Step 3: Verify dev server still builds**

```bash
make check
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/lib/components/ui/tabs/ src/lib/components/ui/popover/ src/lib/components/ui/checkbox/ src/lib/components/ui/collapsible/
git commit -m "feat: add tabs, popover, checkbox, collapsible shadcn components"
```

---

## Task 2: Attribute Service Layer

Create `src/lib/services/attributeService.ts` — thin wrappers around the generated SDK, following the exact pattern from `src/lib/services/applicationService.ts`.

**Files:**
- Create: `src/lib/services/attributeService.ts`

**Step 1: Create the service file**

```typescript
import {
  backstageServiceListAttributes,
  backstageServiceCreateAttribute,
  backstageServiceUpdateAttribute,
  backstageServiceDeleteAttribute,
  backstageServiceArchiveAttribute
} from '$lib/api/generated'
import type {
  Attribute,
  CreateAttributeRequest,
  UpdateAttributeRequest,
  ArchiveAttributeRequest
} from '$lib/api/generated/types.gen'

export async function listAttributes(): Promise<{ data: Attribute[]; total: number }> {
  const { data, error } = await backstageServiceListAttributes({
    query: { pageSize: 1000 }
  })
  if (error) {
    throw new Error('Failed to load attributes')
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0
  }
}

export async function createAttribute(request: CreateAttributeRequest): Promise<Attribute> {
  const { data, error } = await backstageServiceCreateAttribute({
    body: request
  })
  if (error) {
    throw new Error('Failed to create attribute')
  }
  return data!.attribute!
}

export async function updateAttribute(
  attributeId: number,
  request: Omit<UpdateAttributeRequest, 'attributeId'>
): Promise<Attribute> {
  const { data, error } = await backstageServiceUpdateAttribute({
    path: { attributeId },
    body: { ...request, attributeId }
  })
  if (error) {
    throw new Error('Failed to update attribute')
  }
  return data!.attribute!
}

export async function deleteAttribute(attributeId: number): Promise<void> {
  const { error } = await backstageServiceDeleteAttribute({
    path: { attributeId }
  })
  if (error) {
    throw new Error('Failed to delete attribute')
  }
}

export async function archiveAttribute(
  attributeId: number,
  request: ArchiveAttributeRequest
): Promise<void> {
  const { error } = await backstageServiceArchiveAttribute({
    path: { attributeId },
    body: request
  })
  if (error) {
    throw new Error('Failed to archive attribute')
  }
}
```

**Step 2: Verify types compile**

```bash
make check
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/services/attributeService.ts
git commit -m "feat: add attribute service layer"
```

---

## Task 3: Attribute Store (Svelte 5 Runes)

Create `src/lib/stores/attributeStore.svelte.ts` — follows the exact pattern from `src/lib/stores/applicationStore.svelte.ts` but with filtering/sorting/pagination logic.

**Files:**
- Create: `src/lib/stores/attributeStore.svelte.ts`

**Step 1: Create the store file**

The store manages:
- Raw attributes list from API
- Active tab (custom vs built-in)
- Search query (client-side filter on `title` and `name`)
- Filter state: entity, type, visibility (each a `Set<string>`)
- Sort mode: `'most-used' | 'name-asc' | 'name-desc'`
- Pagination: page number, page size (50)
- Create sheet open/close state
- Loading and error states

Key derived values:
- `filteredAttributes` — applies tab → search → filters → sort pipeline
- `paginatedAttributes` — slices `filteredAttributes` for current page
- `totalFiltered` — count after all filters applied
- `totalPages` — `Math.ceil(totalFiltered / pageSize)`
- `activeFilterCount` — number of non-empty filter sets

```typescript
import { listAttributes, createAttribute as createAttributeApi, updateAttribute as updateAttributeApi } from '$lib/services/attributeService'
import type { Attribute, CreateAttributeRequest, UpdateAttributeRequest } from '$lib/api/generated/types.gen'

// Human-readable label maps
export const ENTITY_LABELS: Record<string, string> = {
  ATTRIBUTE_ENTITY_APPLICATION: 'Application',
  ATTRIBUTE_ENTITY_CAMPAIGN: 'Campaign',
  ATTRIBUTE_ENTITY_CART_ITEM: 'Item',
  ATTRIBUTE_ENTITY_COUPON: 'Coupon',
  ATTRIBUTE_ENTITY_CUSTOMER_PROFILE: 'Customer Profile',
  ATTRIBUTE_ENTITY_CUSTOMER_SESSION: 'Current Session',
  ATTRIBUTE_ENTITY_EVENT: 'Event',
  ATTRIBUTE_ENTITY_GIVEAWAY: 'Giveaway',
  ATTRIBUTE_ENTITY_REFERRAL: 'Referral',
  ATTRIBUTE_ENTITY_STORE: 'Store'
}

export const TYPE_LABELS: Record<string, string> = {
  ATTRIBUTE_TYPE_STRING: 'String',
  ATTRIBUTE_TYPE_NUMBER: 'Number',
  ATTRIBUTE_TYPE_BOOLEAN: 'Boolean',
  ATTRIBUTE_TYPE_TIME: 'Time',
  ATTRIBUTE_TYPE_LOCATION: 'Location',
  ATTRIBUTE_TYPE_LIST_OF_STRINGS: 'List (Strings)',
  ATTRIBUTE_TYPE_LIST_OF_NUMBERS: 'List (Numbers)'
}

export type SortMode = 'most-used' | 'name-asc' | 'name-desc'

export type FilterState = {
  entity: Set<string>
  type: Set<string>
  visibility: Set<string>
}

function createAttributeStore() {
  let attributes = $state<Attribute[]>([])
  let loading = $state(false)
  let error = $state<string | null>(null)
  let activeTab = $state<'custom' | 'builtin'>('custom')
  let searchQuery = $state('')
  let filters = $state<FilterState>({
    entity: new Set(),
    type: new Set(),
    visibility: new Set()
  })
  let sortBy = $state<SortMode>('most-used')
  let currentPage = $state(1)
  let pageSize = $state(50)
  let createSheetOpen = $state(false)

  const filteredAttributes = $derived.by(() => {
    let result = attributes

    // Tab filter
    if (activeTab === 'custom') {
      result = result.filter((a) => !a.isBuiltin)
    } else {
      result = result.filter((a) => a.isBuiltin)
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          (a.title ?? '').toLowerCase().includes(q) ||
          (a.name ?? '').toLowerCase().includes(q)
      )
    }

    // Entity filter
    if (filters.entity.size > 0) {
      result = result.filter((a) => a.entity && filters.entity.has(a.entity))
    }

    // Type filter
    if (filters.type.size > 0) {
      result = result.filter((a) => a.type && filters.type.has(a.type))
    }

    // Visibility filter
    if (filters.visibility.size > 0) {
      result = result.filter((a) => {
        const vis = a.editable ? 'visible' : 'hidden'
        return filters.visibility.has(vis)
      })
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.title ?? '').localeCompare(b.title ?? '')
        case 'name-desc':
          return (b.title ?? '').localeCompare(a.title ?? '')
        case 'most-used':
        default:
          return (b.id ?? 0) - (a.id ?? 0)
      }
    })

    return result
  })

  const totalFiltered = $derived(filteredAttributes.length)
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)))
  const paginatedAttributes = $derived(
    filteredAttributes.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  )
  const activeFilterCount = $derived(
    filters.entity.size + filters.type.size + filters.visibility.size
  )

  async function loadAttributes() {
    if (loading) return
    loading = true
    error = null
    try {
      const result = await listAttributes()
      attributes = result.data
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load attributes'
    } finally {
      loading = false
    }
  }

  function setActiveTab(tab: 'custom' | 'builtin') {
    activeTab = tab
    currentPage = 1
  }

  function setSearchQuery(query: string) {
    searchQuery = query
    currentPage = 1
  }

  function toggleFilter(category: keyof FilterState, value: string) {
    const set = new Set(filters[category])
    if (set.has(value)) {
      set.delete(value)
    } else {
      set.add(value)
    }
    filters = { ...filters, [category]: set }
    currentPage = 1
  }

  function clearFilters() {
    filters = { entity: new Set(), type: new Set(), visibility: new Set() }
    currentPage = 1
  }

  function setSortBy(mode: SortMode) {
    sortBy = mode
  }

  function setPage(p: number) {
    currentPage = Math.max(1, Math.min(p, totalPages))
  }

  async function createAttribute(request: CreateAttributeRequest): Promise<Attribute> {
    const attr = await createAttributeApi(request)
    attributes = [attr, ...attributes]
    return attr
  }

  async function toggleVisibility(attr: Attribute): Promise<void> {
    if (!attr.id) return
    const updated = await updateAttributeApi(attr.id, {
      editable: !attr.editable
    })
    attributes = attributes.map((a) => (a.id === updated.id ? updated : a))
  }

  return {
    get attributes() { return attributes },
    get loading() { return loading },
    get error() { return error },
    get activeTab() { return activeTab },
    get searchQuery() { return searchQuery },
    get filters() { return filters },
    get sortBy() { return sortBy },
    get currentPage() { return currentPage },
    get pageSize() { return pageSize },
    get createSheetOpen() { return createSheetOpen },
    set createSheetOpen(v: boolean) { createSheetOpen = v },
    get filteredAttributes() { return filteredAttributes },
    get paginatedAttributes() { return paginatedAttributes },
    get totalFiltered() { return totalFiltered },
    get totalPages() { return totalPages },
    get activeFilterCount() { return activeFilterCount },
    loadAttributes,
    setActiveTab,
    setSearchQuery,
    toggleFilter,
    clearFilters,
    setSortBy,
    setPage,
    createAttribute,
    toggleVisibility
  }
}

export const attributeStore = createAttributeStore()
```

**Step 2: Verify types compile**

```bash
make check
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/stores/attributeStore.svelte.ts
git commit -m "feat: add attribute store with filtering, sorting, pagination"
```

---

## Task 4: Settings Layout & Sidebar

Create the settings layout with a dedicated sidebar that mirrors the Talon.one "MANAGE ACCOUNT" structure. This replaces the placeholder settings page.

**Files:**
- Create: `src/routes/(app)/settings/SettingsSidebar.svelte`
- Modify: `src/routes/(app)/settings/+page.svelte` (redirect to overview)
- Create: `src/routes/(app)/settings/+layout.svelte`

**Reference files:**
- `src/lib/components/layout/DashboardSidebar.svelte` — pattern for sidebar structure
- `src/lib/components/ui/sidebar/index.ts` — available sidebar components
- `src/lib/components/ui/collapsible/` — for expandable sections (installed in Task 1)

**Step 1: Create SettingsSidebar.svelte**

This is the dedicated settings sidebar component. It renders:
- "MANAGE ACCOUNT" header
- Overview link (icon: `LayoutGrid`)
- Organization collapsible (icon: `Building2`)
- Integrations link (icon: `Puzzle`)
- Credentials link (icon: `KeyRound`)
- Tools collapsible (icon: `Wrench`), expanded by default, with sub-items:
  - Attributes, Additional Costs, Collections, Cart Item Catalogs, Custom Effects, Webhooks, Management API Keys, API Tester
- Logs collapsible (icon: `ScrollText`)

Use `page.url.pathname` from `$app/state` to determine the active item. Use shadcn `Sidebar.*` components with `Collapsible` for expandable sections.

The collapsible sections should use `Sidebar.MenuSub` / `Sidebar.MenuSubItem` / `Sidebar.MenuSubButton` for nested items under Tools and Logs.

Icons from `lucide-svelte`: `LayoutGrid`, `Building2`, `Puzzle`, `KeyRound`, `Wrench`, `ScrollText`, `ChevronRight`.

```svelte
<script lang="ts">
  import { page } from '$app/state'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import * as Collapsible from '$lib/components/ui/collapsible/index.js'
  import {
    LayoutGrid,
    Building2,
    Puzzle,
    KeyRound,
    Wrench,
    ScrollText,
    ChevronRight
  } from 'lucide-svelte'

  const pathname = $derived(page.url.pathname)

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const toolsItems = [
    { label: 'Attributes', href: '/settings/tools/attributes' },
    { label: 'Additional Costs', href: '/settings/tools/additional-costs' },
    { label: 'Collections', href: '/settings/tools/collections' },
    { label: 'Cart Item Catalogs', href: '/settings/tools/cart-item-catalogs' },
    { label: 'Custom Effects', href: '/settings/tools/custom-effects' },
    { label: 'Webhooks', href: '/settings/tools/webhooks' },
    { label: 'Management API Keys', href: '/settings/tools/management-api-keys' },
    { label: 'API Tester', href: '/settings/tools/api-tester' }
  ]

  // Tools section is open if any tool sub-item is active, or by default
  let toolsOpen = $state(true)
</script>

<Sidebar.Root collapsible="none" class="border-r">
  <Sidebar.Header class="px-4 pt-6 pb-2">
    <span class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
      Manage Account
    </span>
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <!-- Overview -->
          <Sidebar.MenuItem>
            <Sidebar.MenuButton asChild>
              <a
                href="/settings/overview"
                data-active={isActive('/settings/overview')}
              >
                <LayoutGrid size={18} />
                <span>Overview</span>
              </a>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>

          <!-- Organization -->
          <Sidebar.MenuItem>
            <Sidebar.MenuButton asChild>
              <a
                href="/settings/organization"
                data-active={isActive('/settings/organization')}
              >
                <Building2 size={18} />
                <span>Organization</span>
              </a>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>

          <!-- Integrations -->
          <Sidebar.MenuItem>
            <Sidebar.MenuButton asChild>
              <a
                href="/settings/integrations"
                data-active={isActive('/settings/integrations')}
              >
                <Puzzle size={18} />
                <span>Integrations</span>
              </a>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>

          <!-- Credentials -->
          <Sidebar.MenuItem>
            <Sidebar.MenuButton asChild>
              <a
                href="/settings/credentials"
                data-active={isActive('/settings/credentials')}
              >
                <KeyRound size={18} />
                <span>Credentials</span>
              </a>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>

          <!-- Tools (collapsible) -->
          <Collapsible.Root bind:open={toolsOpen} class="group/collapsible">
            <Sidebar.MenuItem>
              <Collapsible.Trigger asChild>
                <Sidebar.MenuButton>
                  <Wrench size={18} />
                  <span>Tools</span>
                  <ChevronRight
                    size={16}
                    class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                  />
                </Sidebar.MenuButton>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {#each toolsItems as item (item.href)}
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton asChild>
                        <a
                          href={item.href}
                          data-active={isActive(item.href)}
                        >
                          {item.label}
                        </a>
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                  {/each}
                </Sidebar.MenuSub>
              </Collapsible.Content>
            </Sidebar.MenuItem>
          </Collapsible.Root>

          <!-- Logs -->
          <Sidebar.MenuItem>
            <Sidebar.MenuButton asChild>
              <a
                href="/settings/logs"
                data-active={isActive('/settings/logs')}
              >
                <ScrollText size={18} />
                <span>Logs</span>
              </a>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
</Sidebar.Root>
```

**Step 2: Create settings/+layout.svelte**

This layout overrides the parent `(app)/+layout.svelte` by providing a different sidebar. It uses the same `AppShell` wrapper but swaps `DashboardSidebar` for `SettingsSidebar`.

```svelte
<script lang="ts">
  import AppShell from '$lib/components/layout/AppShell.svelte'
  import SettingsSidebar from './SettingsSidebar.svelte'

  let { children } = $props()
</script>

<AppShell>
  {#snippet sidebar()}
    <SettingsSidebar />
  {/snippet}
  {@render children()}
</AppShell>
```

**Step 3: Update settings/+page.svelte to redirect to overview**

```svelte
<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  onMount(() => {
    goto('/settings/overview', { replaceState: true })
  })
</script>
```

**Step 4: Verify dev server shows the sidebar**

```bash
make dev
```

Navigate to `http://localhost:5173/settings` — should redirect to `/settings/overview` (which will 404 until we create it, but the sidebar should render).

**Step 5: Commit**

```bash
git add src/routes/\(app\)/settings/SettingsSidebar.svelte src/routes/\(app\)/settings/+layout.svelte src/routes/\(app\)/settings/+page.svelte
git commit -m "feat: add settings layout with Talon.one-style sidebar navigation"
```

---

## Task 5: Skeleton Pages & Overview Page

Create all placeholder skeleton pages and the Overview page that composes existing settings components.

**Files:**
- Create: `src/routes/(app)/settings/overview/+page.svelte`
- Create: `src/routes/(app)/settings/organization/+page.svelte`
- Create: `src/routes/(app)/settings/integrations/+page.svelte`
- Create: `src/routes/(app)/settings/credentials/+page.svelte`
- Create: `src/routes/(app)/settings/tools/additional-costs/+page.svelte`
- Create: `src/routes/(app)/settings/tools/collections/+page.svelte`
- Create: `src/routes/(app)/settings/tools/cart-item-catalogs/+page.svelte`
- Create: `src/routes/(app)/settings/tools/custom-effects/+page.svelte`
- Create: `src/routes/(app)/settings/tools/webhooks/+page.svelte`
- Create: `src/routes/(app)/settings/tools/management-api-keys/+page.svelte`
- Create: `src/routes/(app)/settings/tools/api-tester/+page.svelte`
- Create: `src/routes/(app)/settings/logs/+page.svelte`

**Step 1: Create Overview page**

The Overview page composes the three existing settings components. These components expect an `application` prop. Use `applicationStore.selectedApplication` to get the current application.

```svelte
<script lang="ts">
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { onMount } from 'svelte'
  import ApplicationDetailsForm from '$lib/components/settings/ApplicationDetailsForm.svelte'
  import PromotionEngineSettings from '$lib/components/settings/PromotionEngineSettings.svelte'
  import AdvancedSettings from '$lib/components/settings/AdvancedSettings.svelte'

  onMount(() => {
    applicationStore.loadApplications()
  })
</script>

<div class="p-8 space-y-8">
  <div>
    <h1 class="text-2xl font-semibold">Overview</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Manage your application settings, promotion engine configuration, and advanced options.
    </p>
  </div>

  {#if applicationStore.selectedApplication}
    <section>
      <h2 class="text-lg font-medium mb-4">Application Details</h2>
      <ApplicationDetailsForm application={applicationStore.selectedApplication} />
    </section>

    <section>
      <h2 class="text-lg font-medium mb-4">Promotion Engine</h2>
      <PromotionEngineSettings application={applicationStore.selectedApplication} />
    </section>

    <section>
      <h2 class="text-lg font-medium mb-4">Advanced</h2>
      <AdvancedSettings application={applicationStore.selectedApplication} />
    </section>
  {:else if applicationStore.loading}
    <p class="text-muted-foreground">Loading application...</p>
  {:else}
    <p class="text-muted-foreground">No application selected. Go to the dashboard and select one.</p>
  {/if}
</div>
```

**Step 2: Create all skeleton pages**

Each skeleton follows the same pattern — just a title and "Coming soon" text. Use this template for each:

```svelte
<div class="p-8">
  <h1 class="text-2xl font-semibold">{PAGE_TITLE}</h1>
  <p class="mt-2 text-muted-foreground">Coming soon.</p>
</div>
```

Create these files with their respective titles:
- `organization/+page.svelte` — "Organization"
- `integrations/+page.svelte` — "Integrations"
- `credentials/+page.svelte` — "Credentials"
- `tools/additional-costs/+page.svelte` — "Additional Costs"
- `tools/collections/+page.svelte` — "Collections"
- `tools/cart-item-catalogs/+page.svelte` — "Cart Item Catalogs"
- `tools/custom-effects/+page.svelte` — "Custom Effects"
- `tools/webhooks/+page.svelte` — "Webhooks"
- `tools/management-api-keys/+page.svelte` — "Management API Keys"
- `tools/api-tester/+page.svelte` — "API Tester"
- `logs/+page.svelte` — "Logs"

**Step 3: Verify everything builds**

```bash
make check
```

Expected: No errors.

**Step 4: Visually verify**

```bash
make dev
```

Navigate to `/settings` → should redirect to `/settings/overview`. Click sidebar items to verify navigation works. All pages should show their title + "Coming soon."

**Step 5: Commit**

```bash
git add src/routes/\(app\)/settings/
git commit -m "feat: add settings overview page and skeleton pages for all sections"
```

---

## Task 6: Attribute Table Component

Create the `AttributeTable.svelte` component that renders the attributes data table.

**Files:**
- Create: `src/lib/components/attributes/AttributeTable.svelte`

**Reference files:**
- `src/lib/components/ui/table/index.ts` — available Table components (Root, Header, Body, Row, Head, Cell, Caption, Footer)
- `src/lib/components/ui/switch/index.ts` — Switch for visibility toggle

**Step 1: Create the component**

This component:
- Receives `attributes` as a prop (array of `Attribute`)
- Renders a table with columns: ATTRIBUTE, API NAME, ENTITY, TYPE, VISIBILITY
- ATTRIBUTE column shows a colored badge — deterministic color from title hash using a small palette of greens/blues/purples
- API NAME in monospace
- ENTITY and TYPE use human-readable labels from the store's `ENTITY_LABELS` and `TYPE_LABELS` maps
- VISIBILITY is a `Switch` toggle that calls a callback prop

Badge color generation: hash the title string to pick from a palette of 8 muted colors (emerald, teal, sky, indigo, violet, amber, rose, slate). This gives deterministic but visually varied badges.

```svelte
<script lang="ts">
  import type { Attribute } from '$lib/api/generated/types.gen'
  import { ENTITY_LABELS, TYPE_LABELS } from '$lib/stores/attributeStore.svelte'
  import * as Table from '$lib/components/ui/table/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'

  let {
    attributes,
    onToggleVisibility
  }: {
    attributes: Attribute[]
    onToggleVisibility: (attr: Attribute) => void
  } = $props()

  const BADGE_COLORS = [
    'bg-emerald-600',
    'bg-teal-600',
    'bg-sky-600',
    'bg-indigo-600',
    'bg-violet-600',
    'bg-amber-600',
    'bg-rose-500',
    'bg-slate-600'
  ]

  function hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return Math.abs(hash)
  }

  function getBadgeColor(title: string): string {
    return BADGE_COLORS[hashString(title) % BADGE_COLORS.length]
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row class="border-b">
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Attribute
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        API Name
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Entity
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Type
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
        Visibility
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each attributes as attr (attr.id)}
      <Table.Row class="hover:bg-muted/50">
        <Table.Cell>
          <span class="inline-block rounded px-2.5 py-1 text-xs font-medium text-white {getBadgeColor(attr.title ?? attr.name ?? '')}">
            {attr.title ?? attr.name ?? '—'}
          </span>
        </Table.Cell>
        <Table.Cell class="font-mono text-sm text-muted-foreground">
          {attr.name ?? '—'}
        </Table.Cell>
        <Table.Cell class="text-sm">
          {ENTITY_LABELS[attr.entity ?? ''] ?? attr.entity ?? '—'}
        </Table.Cell>
        <Table.Cell class="text-sm">
          {TYPE_LABELS[attr.type ?? ''] ?? attr.type ?? '—'}
        </Table.Cell>
        <Table.Cell class="text-right">
          <Switch
            checked={attr.editable ?? false}
            onCheckedChange={() => onToggleVisibility(attr)}
          />
        </Table.Cell>
      </Table.Row>
    {/each}

    {#if attributes.length === 0}
      <Table.Row>
        <Table.Cell colspan={5} class="h-32 text-center text-muted-foreground">
          No attributes found.
        </Table.Cell>
      </Table.Row>
    {/if}
  </Table.Body>
</Table.Root>
```

**Step 2: Verify types compile**

```bash
make check
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/components/attributes/AttributeTable.svelte
git commit -m "feat: add AttributeTable component with badge colors and visibility toggle"
```

---

## Task 7: Filter Dropdown Component

Create `AttributeFilterDropdown.svelte` — a two-level drill-in filter dropdown.

**Files:**
- Create: `src/lib/components/attributes/AttributeFilterDropdown.svelte`

**Reference files:**
- `src/lib/components/ui/popover/index.ts` — Popover components (installed in Task 1)
- `src/lib/components/ui/checkbox/index.ts` — Checkbox for filter options (installed in Task 1)

**Step 1: Create the component**

The filter dropdown has two levels:
1. **Category list:** Entity, Type, Visibility — each row with label + ChevronRight
2. **Options list:** Back arrow + category name, then scrollable checkbox list

Use internal state `activeCategory` to track which level is shown. Animate the transition with CSS `transform: translateX`.

Props:
- `filters: FilterState` — current filter state from store
- `onToggle: (category: keyof FilterState, value: string) => void`
- `activeFilterCount: number`

Entity options: all keys from `ENTITY_LABELS`
Type options: all keys from `TYPE_LABELS`
Visibility options: `[{ value: 'visible', label: 'Visible' }, { value: 'hidden', label: 'Hidden' }]`

Styling per design:
- Button: white bg, thin gray border (`border`), rounded (`rounded-md`), funnel icon + "Filter" text
- Hover: `hover:border-blue-300 hover:text-blue-500`
- Active/open: `border-blue-600 text-blue-600`
- Dropdown panel: white bg, rounded-lg, shadow-lg, `w-56`
- Category rows: `px-3 py-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center`
- Options: checkbox + label, checked row gets `bg-indigo-50`, checkbox uses `data-[state=checked]:bg-blue-600`
- Active filter badge: small blue dot when filters are applied

```svelte
<script lang="ts">
  import { ENTITY_LABELS, TYPE_LABELS, type FilterState } from '$lib/stores/attributeStore.svelte'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { Filter, ChevronRight, ArrowLeft } from 'lucide-svelte'

  let {
    filters,
    onToggle,
    activeFilterCount
  }: {
    filters: FilterState
    onToggle: (category: keyof FilterState, value: string) => void
    activeFilterCount: number
  } = $props()

  let open = $state(false)
  let activeCategory = $state<keyof FilterState | null>(null)

  const categories: { key: keyof FilterState; label: string }[] = [
    { key: 'entity', label: 'Entity' },
    { key: 'type', label: 'Type' },
    { key: 'visibility', label: 'Visibility' }
  ]

  function getOptionsForCategory(cat: keyof FilterState): { value: string; label: string }[] {
    switch (cat) {
      case 'entity':
        return Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }))
      case 'type':
        return Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
      case 'visibility':
        return [
          { value: 'visible', label: 'Visible' },
          { value: 'hidden', label: 'Hidden' }
        ]
    }
  }

  function handleOpenChange(isOpen: boolean) {
    open = isOpen
    if (!isOpen) {
      // Reset to category list when closing
      activeCategory = null
    }
  }
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
  <Popover.Trigger asChild>
    <button
      class="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors
        {open
          ? 'border-blue-600 text-blue-600'
          : 'border-border bg-white text-foreground hover:border-blue-300 hover:text-blue-500'}
        relative"
    >
      <Filter size={14} />
      Filter
      {#if activeFilterCount > 0}
        <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
          {activeFilterCount}
        </span>
      {/if}
    </button>
  </Popover.Trigger>

  <Popover.Content class="w-56 p-0" align="end" sideOffset={8}>
    <div class="overflow-hidden">
      <!-- Two panels that slide left/right -->
      <div
        class="flex transition-transform duration-200 ease-out"
        style="transform: translateX({activeCategory ? '-100%' : '0'}); width: 200%;"
      >
        <!-- Level 1: Category list -->
        <div class="w-1/2 py-1">
          {#each categories as cat (cat.key)}
            <button
              class="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-slate-50 cursor-pointer"
              onclick={() => (activeCategory = cat.key)}
            >
              <span>{cat.label}</span>
              <div class="flex items-center gap-1">
                {#if filters[cat.key].size > 0}
                  <span class="text-xs text-blue-600">{filters[cat.key].size}</span>
                {/if}
                <ChevronRight size={14} class="text-muted-foreground" />
              </div>
            </button>
          {/each}
        </div>

        <!-- Level 2: Options list -->
        <div class="w-1/2">
          {#if activeCategory}
            <div class="flex items-center gap-2 px-3 py-2.5 border-b">
              <button
                class="p-0.5 rounded hover:bg-slate-100"
                onclick={() => (activeCategory = null)}
              >
                <ArrowLeft size={14} />
              </button>
              <span class="text-sm font-medium">
                {categories.find((c) => c.key === activeCategory)?.label}
              </span>
            </div>
            <div class="max-h-64 overflow-y-auto py-1">
              {#each getOptionsForCategory(activeCategory) as option (option.value)}
                {@const checked = filters[activeCategory].has(option.value)}
                <button
                  class="flex w-full items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors
                    {checked ? 'bg-indigo-50' : 'hover:bg-slate-50'}"
                  onclick={() => activeCategory && onToggle(activeCategory, option.value)}
                >
                  <Checkbox
                    {checked}
                    class="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <span>{option.label}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
```

**Step 2: Verify types compile**

```bash
make check
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/components/attributes/AttributeFilterDropdown.svelte
git commit -m "feat: add two-level filter dropdown with drill-in animation"
```

---

## Task 8: Sort Dropdown Component

Create `AttributeSortDropdown.svelte` — icon-only sort button with dropdown.

**Files:**
- Create: `src/lib/components/attributes/AttributeSortDropdown.svelte`

**Step 1: Create the component**

Props:
- `sortBy: SortMode` — current sort mode from store
- `onSort: (mode: SortMode) => void`

Sort options with icons:
- Most Used: `TrendingUp` icon
- Name A-Z: `ArrowDownAZ` icon
- Name Z-A: `ArrowUpZA` icon

Styling per design:
- Square icon-only button, same size/rounding as Filter
- "SORT BY" header in uppercase muted text with separator
- Selected option has indigo/periwinkle background
- Hover: light blue-grey

```svelte
<script lang="ts">
  import type { SortMode } from '$lib/stores/attributeStore.svelte'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { ArrowDownUp, TrendingUp, ArrowDownAZ, ArrowUpZA } from 'lucide-svelte'

  let {
    sortBy,
    onSort
  }: {
    sortBy: SortMode
    onSort: (mode: SortMode) => void
  } = $props()

  let open = $state(false)

  const options: { mode: SortMode; label: string; icon: typeof TrendingUp }[] = [
    { mode: 'most-used', label: 'Most Used', icon: TrendingUp },
    { mode: 'name-asc', label: 'Name A-Z', icon: ArrowDownAZ },
    { mode: 'name-desc', label: 'Name Z-A', icon: ArrowUpZA }
  ]

  function handleSelect(mode: SortMode) {
    onSort(mode)
    open = false
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger asChild>
    <button
      class="inline-flex items-center justify-center rounded-md border p-1.5 transition-colors
        {open
          ? 'border-blue-600 text-blue-600'
          : 'border-border bg-white text-foreground hover:border-blue-300 hover:text-blue-500'}"
    >
      <ArrowDownUp size={14} />
    </button>
  </Popover.Trigger>

  <Popover.Content class="w-44 p-0" align="end" sideOffset={8}>
    <div class="px-3 pt-2.5 pb-1.5">
      <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Sort by
      </span>
    </div>
    <Separator />
    <div class="py-1">
      {#each options as option (option.mode)}
        <button
          class="flex w-full items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors
            {sortBy === option.mode ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}"
          onclick={() => handleSelect(option.mode)}
        >
          <option.icon size={14} />
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  </Popover.Content>
</Popover.Root>
```

**Step 2: Verify types compile**

```bash
make check
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/components/attributes/AttributeSortDropdown.svelte
git commit -m "feat: add sort dropdown with Most Used, A-Z, Z-A options"
```

---

## Task 9: Create Attribute Sheet

Create `CreateAttributeSheet.svelte` — slide-from-right form using shadcn Sheet.

**Files:**
- Create: `src/lib/components/attributes/CreateAttributeSheet.svelte`

**Reference files:**
- `src/lib/components/ui/sheet/index.ts` — Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetClose
- `src/lib/components/ui/select/index.ts` — Select for Entity/Type dropdowns
- `src/lib/components/ui/input/index.ts` — Input for API name/Name
- `src/lib/components/ui/textarea/index.ts` — Textarea for Description
- `src/lib/components/ui/label/index.ts` — Label
- `src/lib/components/ui/button/index.ts` — Button

**Step 1: Create the component**

Props:
- `open: boolean` — bound to store's `createSheetOpen`
- `onOpenChange: (open: boolean) => void`
- `onSubmit: (request: CreateAttributeRequest) => Promise<void>`
- `applications: Application[]` — list of applications for Connected Applications dropdown

Form fields:
1. **Entity** — Required Select from entity enum values
2. **Type** — Required Select from type enum values
3. **API name** — Required Input, alphanumeric + underscores only, auto-generated from Name
4. **Name** — Input with 0/20 char counter, maps to `title`
5. **Description** — Textarea
6. **Connected Applications** — Select with "All Applications" default

Auto-slug: when name changes, auto-generate API name by lowercasing + replacing spaces/non-alphanumeric with underscores. Stop auto-generating if user manually edits the API name field.

Validation:
- Show "Required" error text + red border on Entity/Type after attempted submit
- API name validated for alphanumeric + underscores pattern
- Name max 20 chars

```svelte
<script lang="ts">
  import type { Application, CreateAttributeRequest } from '$lib/api/generated/types.gen'
  import { ENTITY_LABELS, TYPE_LABELS } from '$lib/stores/attributeStore.svelte'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { CircleHelp } from 'lucide-svelte'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

  let {
    open = false,
    onOpenChange,
    onSubmit,
    applications = []
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (request: CreateAttributeRequest) => Promise<void>
    applications: Application[]
  } = $props()

  // Form state
  let entity = $state('')
  let type = $state('')
  let apiName = $state('')
  let name = $state('')
  let description = $state('')
  let selectedAppIds = $state<number[]>([])
  let submitting = $state(false)
  let attempted = $state(false)
  let apiNameManuallyEdited = $state(false)
  let submitError = $state('')

  // Auto-slug generation
  $effect(() => {
    if (!apiNameManuallyEdited && name) {
      apiName = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
    }
  })

  // Validation
  const entityError = $derived(attempted && !entity ? 'Required' : '')
  const typeError = $derived(attempted && !type ? 'Required' : '')
  const apiNameError = $derived(
    attempted && !apiName
      ? 'Required'
      : apiName && !/^[a-zA-Z0-9_]+$/.test(apiName)
        ? 'Only letters, numbers, and underscores'
        : ''
  )

  function resetForm() {
    entity = ''
    type = ''
    apiName = ''
    name = ''
    description = ''
    selectedAppIds = []
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

    if (!entity || !type || !apiName || !/^[a-zA-Z0-9_]+$/.test(apiName)) {
      return
    }

    submitting = true
    try {
      await onSubmit({
        entity,
        type,
        name: apiName,
        title: name || undefined,
        description: description || undefined,
        subscribedApplicationsIds: selectedAppIds.length > 0 ? selectedAppIds : undefined
      })
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError = e instanceof Error ? e.message : 'Failed to create attribute'
    } finally {
      submitting = false
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
  <Sheet.Content side="right" class="w-[480px] sm:max-w-[480px] flex flex-col">
    <Sheet.Header>
      <Sheet.Description class="text-sm text-foreground">
        To send specific data to PromoForge, create custom attributes, set a value for them via
        the integration API or via the Campaign Manager, and use them in your rules.
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
      {#if submitError}
        <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      {/if}

      <!-- Entity -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Entity</Label>
        <Select.Root type="single" bind:value={entity}>
          <Select.Trigger
            class="w-full {entityError ? 'border-destructive ring-destructive' : ''}"
          >
            {entity ? ENTITY_LABELS[entity] ?? entity : 'Select entity...'}
          </Select.Trigger>
          <Select.Content>
            {#each Object.entries(ENTITY_LABELS) as [value, label] (value)}
              <Select.Item {value} {label}>{label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {#if entityError}
          <p class="text-xs text-destructive font-medium">{entityError}</p>
        {/if}
      </div>

      <!-- Type -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Type</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>The data type for this attribute's values.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <Select.Root type="single" bind:value={type}>
          <Select.Trigger
            class="w-full {typeError ? 'border-destructive ring-destructive' : ''}"
          >
            {type ? TYPE_LABELS[type] ?? type : 'Select type...'}
          </Select.Trigger>
          <Select.Content>
            {#each Object.entries(TYPE_LABELS) as [value, label] (value)}
              <Select.Item {value} {label}>{label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {#if typeError}
          <p class="text-xs text-destructive font-medium">{typeError}</p>
        {/if}
      </div>

      <!-- API Name -->
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
          placeholder="e.g. order_status"
        />
        {#if apiNameError}
          <p class="text-xs text-destructive font-medium">{apiNameError}</p>
        {/if}
      </div>

      <!-- Name (title) -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Name</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Human-readable display name for this attribute.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <div class="relative">
          <Input
            value={name}
            oninput={(e: Event) => {
              const val = (e.target as HTMLInputElement).value
              if (val.length <= 20) name = val
            }}
            maxlength={20}
            placeholder="e.g. Order Status"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {name.length} / 20
          </span>
        </div>
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Description</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Optional description for documentation purposes.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <Textarea
          bind:value={description}
          rows={4}
          placeholder="Describe what this attribute is used for..."
        />
      </div>

      <!-- Connected Applications -->
      <div class="space-y-2 pt-2">
        <h3 class="text-base font-medium">Connected Applications</h3>
        <p class="text-sm text-muted-foreground">
          Select the Applications where you want to use the attribute. If you choose none,
          it will be available in all Applications.
        </p>
        <Select.Root
          type="single"
          value={selectedAppIds.length === 0 ? 'all' : String(selectedAppIds[0])}
          onValueChange={(v) => {
            if (v === 'all') {
              selectedAppIds = []
            } else {
              selectedAppIds = [Number(v)]
            }
          }}
        >
          <Select.Trigger class="w-full">
            {selectedAppIds.length === 0
              ? 'All Applications'
              : applications.find((a) => a.id === selectedAppIds[0])?.name ?? 'Selected'}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all" label="All Applications">All Applications</Select.Item>
            {#each applications as app (app.id)}
              <Select.Item value={String(app.id)} label={app.name ?? ''}>
                {app.name ?? `Application ${app.id}`}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>

    <Sheet.Footer class="border-t px-6 py-4">
      <Button variant="ghost" onclick={handleCancel} disabled={submitting}>
        Cancel
      </Button>
      <Button onclick={handleSubmit} disabled={submitting}>
        {#if submitting}
          Creating...
        {:else}
          Create Attribute
        {/if}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
```

**Step 2: Verify types compile**

```bash
make check
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/components/attributes/CreateAttributeSheet.svelte
git commit -m "feat: add CreateAttributeSheet with auto-slug generation and validation"
```

---

## Task 10: Attributes Page (Orchestrator)

Create the main attributes page that wires everything together.

**Files:**
- Create: `src/routes/(app)/settings/tools/attributes/+page.svelte`

**Step 1: Create the page**

This page:
- Calls `attributeStore.loadAttributes()` on mount
- Renders the page header with title + "+ Create Attribute" button
- Renders Tabs (Custom / Built-in)
- Renders toolbar row: search input + filter dropdown + sort dropdown
- Renders `AttributeTable` with `attributeStore.paginatedAttributes`
- Renders pagination controls
- Renders `CreateAttributeSheet` overlay

```svelte
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
    onSubmit={(req) => attributeStore.createAttribute(req)}
    applications={applicationStore.applications}
  />
</div>
```

**Step 2: Verify types compile**

```bash
make check
```

Expected: No errors.

**Step 3: Visually verify**

```bash
make dev
```

Navigate to `/settings/tools/attributes`:
- Should see tabs (Custom / Built-in)
- Search bar with filter + sort buttons
- Table with attributes (or empty state if API returns nothing)
- "+ Create Attribute" opens the sheet from the right
- Filter dropdown drills into categories
- Sort dropdown works
- Pagination shows at bottom

**Step 4: Commit**

```bash
git add src/routes/\(app\)/settings/tools/attributes/+page.svelte
git commit -m "feat: add fully functional attributes page with filter, sort, search, and create sheet"
```

---

## Task 11: Final Verification & Type Check

**Step 1: Full type check**

```bash
make check
```

Expected: 0 errors, 0 warnings.

**Step 2: Visual smoke test**

```bash
make dev
```

Test the following flows:
1. `/settings` redirects to `/settings/overview`
2. Sidebar navigation works — all items clickable, active state highlighted
3. Tools section expands/collapses
4. `/settings/tools/attributes` shows the full attributes UI
5. Tab switching between Custom and Built-in works
6. Search filters the table
7. Filter dropdown opens, drills into categories, checkboxes work
8. Sort dropdown changes table ordering
9. "+ Create Attribute" opens the sheet, form validates, auto-slug works
10. Pagination controls appear and work

**Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address any type or rendering issues from final verification"
```
