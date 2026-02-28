# Custom Effects Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build full CRUD for custom effects using separate page routes (not sheets), with CodeMirror payload editor, following the established webhooks pattern for service/store layers.

**Architecture:** Service layer wraps SDK calls, Svelte 5 rune store manages state, list page at `/settings/tools/custom-effects`, create page at `.../new`, edit page at `.../[id]`. Shared `CustomEffectForm` component handles both create and edit modes. CodeMirror (already installed) used for JSON payload editing.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Tailwind CSS v4, shadcn-svelte, CodeMirror 6, Playwright E2E

---

### Task 1: Service Layer

**Files:**
- Create: `src/lib/services/customEffectService.ts`

**Step 1: Create the service file**

```typescript
import {
  backstageServiceListCustomEffects,
  backstageServiceCreateCustomEffect,
  backstageServiceGetCustomEffect,
  backstageServiceUpdateCustomEffect,
  backstageServiceDeleteCustomEffect,
} from "$lib/api/generated";
import type {
  CustomEffect,
  CreateCustomEffectRequest,
  UpdateCustomEffectRequest,
} from "$lib/api/generated/types.gen";

export async function listCustomEffects(): Promise<{
  data: CustomEffect[];
  total: number;
}> {
  const { data, error } = await backstageServiceListCustomEffects({
    query: { pageSize: 1000 },
  });
  if (error) {
    throw new Error("Failed to load custom effects");
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  };
}

export async function getCustomEffect(customEffectId: number): Promise<CustomEffect> {
  const { data, error } = await backstageServiceGetCustomEffect({
    path: { customEffectId },
  });
  if (error) {
    throw new Error("Failed to load custom effect");
  }
  return data!.customEffect!;
}

export async function createCustomEffect(
  request: CreateCustomEffectRequest,
): Promise<CustomEffect> {
  const { data, error } = await backstageServiceCreateCustomEffect({
    body: request,
  });
  if (error) {
    throw new Error("Failed to create custom effect");
  }
  return data!.customEffect!;
}

export async function updateCustomEffect(
  customEffectId: number,
  request: Omit<UpdateCustomEffectRequest, "customEffectId">,
): Promise<CustomEffect> {
  const { data, error } = await backstageServiceUpdateCustomEffect({
    path: { customEffectId },
    body: { ...request, customEffectId },
  });
  if (error) {
    throw new Error("Failed to update custom effect");
  }
  return data!.customEffect!;
}

export async function deleteCustomEffect(customEffectId: number): Promise<void> {
  const { error } = await backstageServiceDeleteCustomEffect({
    path: { customEffectId },
  });
  if (error) {
    throw new Error("Failed to delete custom effect");
  }
}
```

**Step 2: Verify no type errors**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`
Expected: No errors in the new file

**Step 3: Commit**

```bash
git add src/lib/services/customEffectService.ts
git commit -m "feat(custom-effects): add service layer for custom effects CRUD"
```

---

### Task 2: Store

**Files:**
- Create: `src/lib/stores/customEffectStore.svelte.ts`

**Step 1: Create the store file**

```typescript
import {
  listCustomEffects,
  createCustomEffect as createCustomEffectApi,
  updateCustomEffect as updateCustomEffectApi,
  deleteCustomEffect as deleteCustomEffectApi,
  getCustomEffect as getCustomEffectApi,
} from "$lib/services/customEffectService";
import type {
  CustomEffect,
  CreateCustomEffectRequest,
  UpdateCustomEffectRequest,
} from "$lib/api/generated/types.gen";

function createCustomEffectStore() {
  let customEffects = $state<CustomEffect[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state("");
  let currentPage = $state(1);
  let pageSize = $state(50);

  const filteredCustomEffects = $derived.by(() => {
    let result = customEffects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ce) =>
          (ce.apiName ?? "").toLowerCase().includes(q) ||
          (ce.ruleBuilderName ?? "").toLowerCase().includes(q) ||
          (ce.description ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  });

  const totalFiltered = $derived(filteredCustomEffects.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)));
  const paginatedCustomEffects = $derived(
    filteredCustomEffects.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
  );

  async function loadCustomEffects() {
    if (loading) return;
    loading = true;
    error = null;
    try {
      const result = await listCustomEffects();
      customEffects = result.data;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load custom effects";
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

  async function addCustomEffect(request: CreateCustomEffectRequest): Promise<CustomEffect> {
    const effect = await createCustomEffectApi(request);
    customEffects = [effect, ...customEffects];
    return effect;
  }

  async function modifyCustomEffect(
    id: number,
    request: Omit<UpdateCustomEffectRequest, "customEffectId">,
  ): Promise<CustomEffect> {
    const updated = await updateCustomEffectApi(id, request);
    customEffects = customEffects.map((ce) => (ce.id === updated.id ? updated : ce));
    return updated;
  }

  async function removeCustomEffect(id: number): Promise<void> {
    await deleteCustomEffectApi(id);
    customEffects = customEffects.filter((ce) => ce.id !== id);
  }

  async function fetchCustomEffect(id: number): Promise<CustomEffect> {
    return getCustomEffectApi(id);
  }

  return {
    get customEffects() { return customEffects; },
    get loading() { return loading; },
    get error() { return error; },
    get searchQuery() { return searchQuery; },
    get currentPage() { return currentPage; },
    get pageSize() { return pageSize; },
    get filteredCustomEffects() { return filteredCustomEffects; },
    get paginatedCustomEffects() { return paginatedCustomEffects; },
    get totalFiltered() { return totalFiltered; },
    get totalPages() { return totalPages; },

    loadCustomEffects,
    setSearchQuery,
    setPage,
    addCustomEffect,
    modifyCustomEffect,
    removeCustomEffect,
    fetchCustomEffect,
  };
}

export const customEffectStore = createCustomEffectStore();
```

**Step 2: Verify no type errors**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/stores/customEffectStore.svelte.ts
git commit -m "feat(custom-effects): add Svelte 5 rune store for custom effects"
```

---

### Task 3: Custom Effects Table Component

**Files:**
- Create: `src/lib/components/custom-effects/CustomEffectTable.svelte`

**Step 1: Create the table component**

Follows the `WebhookTable.svelte` pattern. Columns: ID, Title (two-line: ruleBuilderName as link + apiName), Applications (icon + count), Scope.

```svelte
<script lang="ts">
  import type { CustomEffect, Application } from '$lib/api/generated/types.gen'
  import * as Table from '$lib/components/ui/table/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { LayoutGrid } from 'lucide-svelte'

  let {
    customEffects,
    applications = [],
    onEdit,
  }: {
    customEffects: CustomEffect[]
    applications?: Application[]
    onEdit?: (effect: CustomEffect) => void
  } = $props()

  function getScopeLabel(scope: string | undefined): string {
    if (scope === 'CUSTOM_EFFECT_SCOPE_SESSION') return 'Cart (Session)'
    if (scope === 'CUSTOM_EFFECT_SCOPE_CART_ITEM') return 'Item'
    return '—'
  }

  function getAppDisplay(effect: CustomEffect): { label: string; apps: Application[] } {
    const ids = effect.connectedApplicationIds
    if (!ids || ids.length === 0) {
      return { label: '0', apps: [] }
    }
    const matched = ids
      .map((id) => applications.find((a) => a.id === id))
      .filter((a): a is Application => !!a)
    return { label: String(ids.length), apps: matched }
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row class="border-b">
      <Table.Head class="w-16 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        ID
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Title
      </Table.Head>
      <Table.Head class="w-40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Applications
      </Table.Head>
      <Table.Head class="w-40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Scope
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each customEffects as effect (effect.id)}
      {@const appInfo = getAppDisplay(effect)}
      <Table.Row class="group hover:bg-muted/50">
        <Table.Cell class="text-sm text-muted-foreground">
          {effect.id ?? '—'}
        </Table.Cell>
        <Table.Cell>
          <button
            class="text-sm font-medium text-primary hover:underline cursor-pointer text-left"
            onclick={() => onEdit?.(effect)}
          >
            {effect.ruleBuilderName ?? '—'}
          </button>
          {#if effect.apiName}
            <p class="text-xs text-muted-foreground mt-0.5">{effect.apiName}</p>
          {/if}
        </Table.Cell>
        <Table.Cell>
          {#if appInfo.apps.length > 0}
            <Tooltip.Root>
              <Tooltip.Trigger>
                <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <LayoutGrid size={16} />
                  {appInfo.label}
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <div class="space-y-1">
                  {#each appInfo.apps as app (app.id)}
                    <div class="flex items-center gap-1.5 text-sm">
                      <span class="h-2 w-2 rounded-sm bg-primary shrink-0"></span>
                      {app.name ?? 'Unknown'}
                    </div>
                  {/each}
                </div>
              </Tooltip.Content>
            </Tooltip.Root>
          {:else}
            <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
              <LayoutGrid size={16} />
              {appInfo.label}
            </div>
          {/if}
        </Table.Cell>
        <Table.Cell class="text-sm text-foreground">
          {getScopeLabel(effect.scope)}
        </Table.Cell>
      </Table.Row>
    {/each}

    {#if customEffects.length === 0}
      <Table.Row>
        <Table.Cell colspan={4} class="h-32 text-center text-muted-foreground">
          No custom effects found.
        </Table.Cell>
      </Table.Row>
    {/if}
  </Table.Body>
</Table.Root>
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/components/custom-effects/CustomEffectTable.svelte
git commit -m "feat(custom-effects): add custom effect table component"
```

---

### Task 4: Parameters Input Component

**Files:**
- Create: `src/lib/components/custom-effects/CustomEffectParametersInput.svelte`

**Step 1: Create the parameters input component**

Follows `WebhookParametersInput.svelte` pattern but with custom effect parameter types.

```svelte
<script lang="ts">
  import type { CustomEffectParameter } from '$lib/api/generated/types.gen'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Trash2, Plus, GripVertical } from 'lucide-svelte'

  let {
    parameters = $bindable<CustomEffectParameter[]>([]),
    disabled = false,
  }: {
    parameters: CustomEffectParameter[]
    disabled?: boolean
  } = $props()

  const PARAM_TYPES = [
    { value: 'CUSTOM_EFFECT_PARAMETER_TYPE_STRING', label: 'string' },
    { value: 'CUSTOM_EFFECT_PARAMETER_TYPE_NUMBER', label: 'number' },
    { value: 'CUSTOM_EFFECT_PARAMETER_TYPE_BOOLEAN', label: 'boolean' },
    { value: 'CUSTOM_EFFECT_PARAMETER_TYPE_TIME', label: 'time' },
  ] as const

  function addParameter() {
    parameters = [
      ...parameters,
      { type: 'CUSTOM_EFFECT_PARAMETER_TYPE_STRING', name: '', description: '' },
    ]
  }

  function removeParameter(index: number) {
    parameters = parameters.filter((_, i) => i !== index)
  }

  function updateParameter(index: number, field: keyof CustomEffectParameter, val: string) {
    parameters = parameters.map((p, i) => (i === index ? { ...p, [field]: val } : p))
  }

  function getTypeLabel(type: string | undefined): string {
    return PARAM_TYPES.find((t) => t.value === type)?.label ?? 'string'
  }
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-base font-medium">Parameters</h3>
  </div>

  {#if parameters.length > 0}
    <div class="space-y-2">
      <div class="grid grid-cols-[120px_1fr_1fr_auto_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Param type</span>
        <span>Param name</span>
        <span>Param description</span>
        <span></span>
        <span></span>
      </div>
      {#each parameters as param, i (i)}
        <div class="grid grid-cols-[120px_1fr_1fr_auto_auto] gap-2 items-center">
          <Select.Root
            type="single"
            value={param.type ?? 'CUSTOM_EFFECT_PARAMETER_TYPE_STRING'}
            onValueChange={(val) => { if (val) updateParameter(i, 'type', val) }}
            disabled={disabled}
          >
            <Select.Trigger class="w-full text-sm">
              {getTypeLabel(param.type)}
            </Select.Trigger>
            <Select.Content>
              {#each PARAM_TYPES as pt (pt.value)}
                <Select.Item value={pt.value}>{pt.label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>

          <Input
            value={param.name ?? ''}
            placeholder="Enter parameter name"
            oninput={(e: Event) => updateParameter(i, 'name', (e.target as HTMLInputElement).value)}
            disabled={disabled}
          />

          <Input
            value={param.description ?? ''}
            placeholder="Enter the description of the parameter"
            oninput={(e: Event) => updateParameter(i, 'description', (e.target as HTMLInputElement).value)}
            disabled={disabled}
          />

          <div class="text-muted-foreground cursor-grab">
            <GripVertical size={16} />
          </div>

          <button
            class="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            onclick={() => removeParameter(i)}
            disabled={disabled}
          >
            <Trash2 size={14} />
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <Button variant="ghost" size="sm" class="text-primary" onclick={addParameter} disabled={disabled}>
    <Plus size={14} class="mr-1" />
    Add
  </Button>
</div>
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/components/custom-effects/CustomEffectParametersInput.svelte
git commit -m "feat(custom-effects): add parameters input component"
```

---

### Task 5: Payload Editor Component

**Files:**
- Create: `src/lib/components/custom-effects/CustomEffectPayloadEditor.svelte`

**Step 1: Create the payload editor**

Adapts `WebhookPayloadEditor.svelte` with the custom effect reference box showing attribute and parameter template syntax.

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { EditorView, basicSetup } from 'codemirror'
  import { json } from '@codemirror/lang-json'
  import { EditorState } from '@codemirror/state'

  let {
    value = $bindable(''),
  }: {
    value: string
  } = $props()

  let editorContainer: HTMLDivElement
  let view: EditorView | undefined

  const REFERENCE_LINES = [
    { label: 'Reference an attribute:', code: '"attributePayload": "${$Profile.Attributes.Name}"' },
    { label: 'Reference a parameter:', code: '"parameterPayload": "${$ParameterName}"' },
    { label: "For parameters of type 'list of strings', omit the quotes:", code: '"listOfStringsParameter": ${$ParameterName}' },
  ]

  onMount(() => {
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        value = update.state.doc.toString()
      }
    })

    view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          json(),
          updateListener,
          EditorView.theme({
            '&': {
              fontSize: '13px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            },
            '.cm-content': {
              fontFamily: 'var(--font-mono)',
              padding: '8px 0',
            },
            '.cm-gutters': {
              backgroundColor: 'var(--color-muted)',
              color: 'var(--color-muted-foreground)',
              border: 'none',
              borderRadius: 'var(--radius) 0 0 var(--radius)',
            },
            '.cm-activeLine': {
              backgroundColor: 'var(--color-accent)',
            },
            '&.cm-focused': {
              outline: '2px solid var(--color-ring)',
              outlineOffset: '-1px',
            },
          }),
        ],
      }),
      parent: editorContainer,
    })
  })

  $effect(() => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      })
    }
  })

  onDestroy(() => {
    view?.destroy()
  })
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-base font-medium">Payload</h3>
  </div>

  <div class="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 space-y-2">
    {#each REFERENCE_LINES as line}
      <div>
        <p class="text-xs text-muted-foreground">{line.label}</p>
        <code class="text-xs font-mono text-foreground">{line.code}</code>
      </div>
    {/each}
  </div>

  <div>
    <span class="text-sm font-medium">Effect payload</span>
    <div bind:this={editorContainer} class="mt-1.5 min-h-[200px]"></div>
  </div>
</div>
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/components/custom-effects/CustomEffectPayloadEditor.svelte
git commit -m "feat(custom-effects): add CodeMirror payload editor component"
```

---

### Task 6: Shared Form Component

**Files:**
- Create: `src/lib/components/custom-effects/CustomEffectForm.svelte`

**Step 1: Create the shared form component**

This component handles both create and edit modes. Props: `mode`, optional `customEffect` for edit.

Key behaviors:
- Scope radio disabled in edit mode
- apiName field disabled in edit mode (cannot change after creation)
- Warning banner differs between create (yellow — scope can't change) and edit (blue — parameters locked if in rules)
- Submit button text: "Create" for create mode, "Save" for edit mode
- Required fields: apiName, ruleBuilderName, payload
- Applications multi-select using shadcn Select component
- The form dispatches `onSubmit` for create and `onSave` for edit, and `onCancel` for both
- `onDelete` only available in edit mode

```svelte
<script lang="ts">
  import type { CustomEffect, CustomEffectParameter, Application } from '$lib/api/generated/types.gen'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
  import { TriangleAlert, Info, X } from 'lucide-svelte'
  import CustomEffectParametersInput from './CustomEffectParametersInput.svelte'
  import CustomEffectPayloadEditor from './CustomEffectPayloadEditor.svelte'

  let {
    mode,
    customEffect,
    applications = [],
    saving = false,
    onSubmit,
    onSave,
    onCancel,
    onDelete,
  }: {
    mode: 'create' | 'edit'
    customEffect?: CustomEffect
    applications?: Application[]
    saving?: boolean
    onSubmit?: (data: {
      apiName: string
      ruleBuilderName: string
      description: string
      scope: string
      applicationIds: number[]
      parameters: CustomEffectParameter[]
      payload: string
    }) => void
    onSave?: (data: {
      ruleBuilderName: string
      description: string
      applicationIds: number[]
      parameters: CustomEffectParameter[]
      payload: string
    }) => void
    onCancel?: () => void
    onDelete?: () => void
  } = $props()

  let scope = $state(customEffect?.scope ?? 'CUSTOM_EFFECT_SCOPE_SESSION')
  let apiName = $state(customEffect?.apiName ?? '')
  let ruleBuilderName = $state(customEffect?.ruleBuilderName ?? '')
  let description = $state(customEffect?.description ?? '')
  let selectedAppIds = $state<number[]>(customEffect?.connectedApplicationIds ?? [])
  let parameters = $state<CustomEffectParameter[]>(customEffect?.parameters ?? [])
  let payload = $state(customEffect?.payload ?? '{\n  \n}')
  let deleteDialogOpen = $state(false)

  const isValid = $derived(
    apiName.trim().length > 0 &&
    ruleBuilderName.trim().length > 0 &&
    payload.trim().length > 0
  )

  function handleSubmit() {
    if (!isValid) return
    if (mode === 'create') {
      onSubmit?.({
        apiName: apiName.trim(),
        ruleBuilderName: ruleBuilderName.trim(),
        description: description.trim(),
        scope,
        applicationIds: selectedAppIds,
        parameters,
        payload,
      })
    } else {
      onSave?.({
        ruleBuilderName: ruleBuilderName.trim(),
        description: description.trim(),
        applicationIds: selectedAppIds,
        parameters,
        payload,
      })
    }
  }

  function toggleApp(appId: number) {
    if (selectedAppIds.includes(appId)) {
      selectedAppIds = selectedAppIds.filter((id) => id !== appId)
    } else {
      selectedAppIds = [...selectedAppIds, appId]
    }
  }

  function getAppName(id: number): string {
    return applications.find((a) => a.id === id)?.name ?? `App ${id}`
  }
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit() }} class="space-y-8">
  <!-- Warning Banner -->
  {#if mode === 'create'}
    <div class="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4">
      <TriangleAlert size={18} class="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <p class="text-sm text-amber-800 dark:text-amber-200">
        The custom effect scope cannot be changed after the custom effect is created.
      </p>
    </div>
  {:else}
    <div class="flex items-start gap-3 rounded-md border border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700 p-4">
      <Info size={18} class="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <p class="text-sm text-blue-800 dark:text-blue-200">
        You cannot change the parameters of custom effects used in rules.
      </p>
    </div>
  {/if}

  <!-- Properties Section -->
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Properties</h2>

    <!-- Scope -->
    <div class="space-y-2">
      <Label>Scope</Label>
      <RadioGroup.Root
        value={scope}
        onValueChange={(val) => { if (val) scope = val }}
        disabled={mode === 'edit'}
        class="flex gap-4"
      >
        <div class="flex items-center gap-2">
          <RadioGroup.Item value="CUSTOM_EFFECT_SCOPE_SESSION" id="scope-session" />
          <Label for="scope-session" class="font-normal">Cart (Session)</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroup.Item value="CUSTOM_EFFECT_SCOPE_CART_ITEM" id="scope-item" />
          <Label for="scope-item" class="font-normal">Item</Label>
        </div>
      </RadioGroup.Root>
    </div>

    <!-- API name + Rule Builder name -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <Label for="api-name">API name</Label>
        <Input
          id="api-name"
          value={apiName}
          placeholder="Type effect name (API)"
          oninput={(e: Event) => (apiName = (e.target as HTMLInputElement).value)}
          disabled={mode === 'edit'}
        />
      </div>
      <div class="space-y-1.5">
        <Label for="rb-name">Rule Builder name</Label>
        <Input
          id="rb-name"
          value={ruleBuilderName}
          placeholder="Type effect name (Rule Builder)"
          oninput={(e: Event) => (ruleBuilderName = (e.target as HTMLInputElement).value)}
        />
      </div>
    </div>

    <!-- Description + Applications -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <Label for="description">Custom effect description</Label>
        <Input
          id="description"
          value={description}
          placeholder="Description"
          oninput={(e: Event) => (description = (e.target as HTMLInputElement).value)}
        />
      </div>
      <div class="space-y-1.5">
        <Label>Applications</Label>
        <div class="relative">
          <div class="flex flex-wrap gap-1 min-h-[38px] rounded-md border border-input bg-background px-3 py-1.5 text-sm">
            {#each selectedAppIds as appId (appId)}
              <span class="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                {getAppName(appId)}
                <button type="button" class="hover:text-destructive cursor-pointer" onclick={() => toggleApp(appId)}>
                  <X size={12} />
                </button>
              </span>
            {/each}
          </div>
          {#if applications.length > 0}
            <div class="mt-1 border rounded-md max-h-40 overflow-y-auto">
              {#each applications as app (app.id)}
                {#if app.id != null && !selectedAppIds.includes(app.id)}
                  <button
                    type="button"
                    class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted cursor-pointer"
                    onclick={() => { if (app.id != null) toggleApp(app.id) }}
                  >
                    {app.name ?? `App ${app.id}`}
                  </button>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Parameters Section -->
  <CustomEffectParametersInput bind:parameters />

  <!-- Payload Section -->
  <CustomEffectPayloadEditor bind:value={payload} />

  <!-- Actions -->
  <div class="flex justify-end gap-3 pt-4 border-t">
    <Button type="button" variant="ghost" onclick={() => onCancel?.()}>Cancel</Button>

    {#if mode === 'edit' && onDelete}
      <AlertDialog.Root bind:open={deleteDialogOpen}>
        <AlertDialog.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline" class="text-destructive border-destructive hover:bg-destructive/10">
              Delete Custom Effect
            </Button>
          {/snippet}
        </AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Delete Custom Effect</AlertDialog.Title>
            <AlertDialog.Description>
              Are you sure you want to delete this custom effect? This action cannot be undone.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
              class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onclick={() => onDelete?.()}
            >
              Delete Custom Effect
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Root>
    {/if}

    <Button type="submit" disabled={!isValid || saving}>
      {mode === 'create' ? 'Create' : 'Save'}
    </Button>
  </div>
</form>
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/components/custom-effects/CustomEffectForm.svelte
git commit -m "feat(custom-effects): add shared create/edit form component"
```

---

### Task 7: List Page

**Files:**
- Modify: `src/routes/(app)/settings/tools/custom-effects/+page.svelte`

**Step 1: Replace the stub with the full list page**

```svelte
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
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/routes/\(app\)/settings/tools/custom-effects/+page.svelte
git commit -m "feat(custom-effects): build list page replacing stub"
```

---

### Task 8: Create Page

**Files:**
- Create: `src/routes/(app)/settings/tools/custom-effects/new/+page.svelte`

**Step 1: Create the create page**

```svelte
<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { customEffectStore } from '$lib/stores/customEffectStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import CustomEffectForm from '$lib/components/custom-effects/CustomEffectForm.svelte'

  let saving = $state(false)

  onMount(() => {
    applicationStore.loadApplications()
  })
</script>

<div class="flex flex-col h-full">
  <div class="flex-1 overflow-y-auto px-8 py-8 max-w-4xl">
    <CustomEffectForm
      mode="create"
      applications={applicationStore.applications}
      {saving}
      onSubmit={async (data) => {
        saving = true
        try {
          await customEffectStore.addCustomEffect({
            apiName: data.apiName,
            ruleBuilderName: data.ruleBuilderName,
            description: data.description,
            scope: data.scope,
            applicationIds: data.applicationIds,
            parameters: data.parameters,
            payload: data.payload,
          })
          goto('/settings/tools/custom-effects')
        } catch (e) {
          console.error('Failed to create custom effect:', e)
        } finally {
          saving = false
        }
      }}
      onCancel={() => goto('/settings/tools/custom-effects')}
    />
  </div>
</div>
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/routes/\(app\)/settings/tools/custom-effects/new/+page.svelte
git commit -m "feat(custom-effects): add create page"
```

---

### Task 9: Edit Page

**Files:**
- Create: `src/routes/(app)/settings/tools/custom-effects/[id]/+page.svelte`

**Step 1: Create the edit page**

```svelte
<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { customEffectStore } from '$lib/stores/customEffectStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import type { CustomEffect } from '$lib/api/generated/types.gen'
  import CustomEffectForm from '$lib/components/custom-effects/CustomEffectForm.svelte'

  let customEffect = $state<CustomEffect | null>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)
  let saving = $state(false)

  const effectId = $derived(Number($page.params.id))

  onMount(async () => {
    applicationStore.loadApplications()
    try {
      customEffect = await customEffectStore.fetchCustomEffect(effectId)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load custom effect'
    } finally {
      loading = false
    }
  })
</script>

<div class="flex flex-col h-full">
  <!-- Breadcrumb -->
  <div class="px-8 pt-6 pb-2">
    <nav class="text-sm text-muted-foreground">
      <a href="/settings/tools/custom-effects" class="hover:text-foreground">Custom Effects</a>
      <span class="mx-1">›</span>
      <span class="text-foreground">{customEffect?.ruleBuilderName ?? '...'}</span>
    </nav>
  </div>

  <div class="flex-1 overflow-y-auto px-8 py-4 max-w-4xl">
    {#if loading}
      <div class="flex items-center justify-center py-16">
        <p class="text-muted-foreground">Loading custom effect...</p>
      </div>
    {:else if error}
      <div class="flex items-center justify-center py-16">
        <p class="text-destructive">{error}</p>
      </div>
    {:else if customEffect}
      <CustomEffectForm
        mode="edit"
        {customEffect}
        applications={applicationStore.applications}
        {saving}
        onSave={async (data) => {
          saving = true
          try {
            customEffect = await customEffectStore.modifyCustomEffect(effectId, {
              ruleBuilderName: data.ruleBuilderName,
              description: data.description,
              applicationIds: data.applicationIds,
              parameters: data.parameters,
              payload: data.payload,
            })
          } catch (e) {
            console.error('Failed to update custom effect:', e)
          } finally {
            saving = false
          }
        }}
        onCancel={() => goto('/settings/tools/custom-effects')}
        onDelete={async () => {
          try {
            await customEffectStore.removeCustomEffect(effectId)
            goto('/settings/tools/custom-effects')
          } catch (e) {
            console.error('Failed to delete custom effect:', e)
          }
        }}
      />
    {/if}
  </div>
</div>
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/routes/\(app\)/settings/tools/custom-effects/\[id\]/+page.svelte
git commit -m "feat(custom-effects): add edit page with breadcrumb and delete"
```

---

### Task 10: E2E Seed Data

**Files:**
- Modify: `e2e/global-setup.ts` — add custom effect seed data
- Modify: `e2e/test-state.ts` — add `customEffectIds` to `TestState`

**Step 1: Add `customEffectIds` to test-state.ts**

In `e2e/test-state.ts`, add to the `TestState` interface:
```typescript
customEffectIds: number[];
```

**Step 2: Add custom effect seed data to global-setup.ts**

Add after the webhooks section:

```typescript
// Create test custom effects
const customEffectConfigs = [
  {
    apiName: "e2e_strikethrough",
    ruleBuilderName: "E2E Strikethrough Effect",
    description: "Custom effect for E2E display tests",
    scope: "CUSTOM_EFFECT_SCOPE_CART_ITEM",
    applicationIds: [app.id],
    parameters: [
      {
        type: "CUSTOM_EFFECT_PARAMETER_TYPE_STRING",
        name: "message",
        description: "The strikethrough message",
      },
    ],
    payload: '{"strikethrough": "${$message}"}',
  },
  {
    apiName: "e2e_editable_effect",
    ruleBuilderName: "E2E Editable Effect",
    description: "Custom effect for edit/delete E2E tests",
    scope: "CUSTOM_EFFECT_SCOPE_SESSION",
    applicationIds: [app.id],
    parameters: [],
    payload: '{"editable": true}',
  },
];

const customEffectIds: number[] = [];
for (const config of customEffectConfigs) {
  const ceRes = await apiPost("/api/v1/custom_effects", config, true);
  if (ceRes) {
    const ce = ceRes.customEffect;
    customEffectIds.push(ce.id);
    console.log(`Created custom effect: ${ce.ruleBuilderName} (id=${ce.id})`);
  } else {
    console.log(`Custom effect ${config.ruleBuilderName} already exists, skipping`);
  }
}
```

Add `customEffectIds` to the `saveTestState` call.

**Step 3: Verify builds**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && npx tsc --noEmit -p e2e/tsconfig.json` (or just `make check`)
Expected: No errors

**Step 4: Commit**

```bash
git add e2e/global-setup.ts e2e/test-state.ts
git commit -m "test(custom-effects): add custom effect seed data for E2E tests"
```

---

### Task 11: E2E Tests

**Files:**
- Create: `e2e/tests/custom-effects.spec.ts`

**Step 1: Write E2E tests**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Custom Effects", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/tools/custom-effects");
    await expect(
      page.getByRole("heading", { name: "Custom Effects" })
    ).toBeVisible({ timeout: 15_000 });
    // Wait for seeded effect to appear
    await expect(
      page.getByText("E2E Strikethrough Effect")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should display the custom effects list with seeded data", async ({
    page,
  }) => {
    await expect(page.getByText("E2E Strikethrough Effect")).toBeVisible();
    await expect(page.getByText("E2E Editable Effect")).toBeVisible();

    // Verify table columns
    const table = page.locator("table");
    await expect(table.getByText("ID")).toBeVisible();
    await expect(table.getByText("Title")).toBeVisible();
    await expect(table.getByText("Applications")).toBeVisible();
    await expect(table.getByText("Scope")).toBeVisible();

    // Verify scope display
    await expect(table.getByText("Item").first()).toBeVisible();
    await expect(table.getByText("Cart (Session)").first()).toBeVisible();

    // Verify API name appears as secondary text
    await expect(table.getByText("e2e_strikethrough")).toBeVisible();
  });

  test("should create a new custom effect", async ({ page }) => {
    await page.getByRole("button", { name: "Create Custom Effect" }).click();
    await expect(page).toHaveURL(/\/custom-effects\/new/);

    // Verify warning banner
    await expect(
      page.getByText("The custom effect scope cannot be changed")
    ).toBeVisible();

    // Fill API name
    await page.getByLabel("API name").fill("e2e_created_effect");

    // Fill Rule Builder name
    await page.getByLabel("Rule Builder name").fill("E2E Created Effect");

    // Fill description
    await page.getByLabel("Custom effect description").fill("Created by E2E test");

    // Submit
    const createPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/custom_effects") && req.method() === "POST"
    );
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await createPromise;

    // Should navigate back to list
    await expect(page).toHaveURL(/\/custom-effects$/);
    await expect(page.getByText("E2E Created Effect")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should edit a custom effect", async ({ page }) => {
    // Click effect name to navigate to edit page
    await page.getByText("E2E Editable Effect").first().click();
    await expect(page).toHaveURL(/\/custom-effects\/\d+/);

    // Verify breadcrumb
    await expect(page.getByText("Custom Effects")).toBeVisible();
    await expect(page.getByText("E2E Editable Effect")).toBeVisible();

    // Change Rule Builder name
    const nameInput = page.getByLabel("Rule Builder name");
    await nameInput.clear();
    await nameInput.fill("Updated Effect");

    const updatePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/custom_effects/") && req.method() === "PUT"
    );

    await page.getByRole("button", { name: "Save", exact: true }).click();
    await updatePromise;

    // Navigate back and verify
    await page.goto("/settings/tools/custom-effects");
    await expect(page.getByText("Updated Effect")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should delete a custom effect", async ({ page }) => {
    // Navigate to E2E Created Effect (created in previous test)
    await expect(page.getByText("E2E Created Effect")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByText("E2E Created Effect").first().click();
    await expect(page).toHaveURL(/\/custom-effects\/\d+/);

    // Click Delete
    await page.getByRole("button", { name: "Delete Custom Effect" }).click();

    // Confirm in dialog
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();

    const deletePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/custom_effects/") &&
        req.method() === "DELETE"
    );

    await dialog
      .getByRole("button", { name: "Delete Custom Effect" })
      .click();
    await deletePromise;

    // Should navigate back to list
    await expect(page).toHaveURL(/\/custom-effects$/);
    await expect(page.getByText("E2E Created Effect")).toBeHidden({
      timeout: 10_000,
    });
  });

  test("should filter custom effects by search", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Name or Description");
    await searchInput.fill("Strikethrough");

    await expect(page.getByText("E2E Strikethrough Effect")).toBeVisible();

    // Clear and search for nonexistent
    await searchInput.clear();
    await searchInput.fill("nonexistent-effect-xyz");
    await expect(page.getByText("No custom effects found.")).toBeVisible();
  });
});
```

**Step 2: Commit**

```bash
git add e2e/tests/custom-effects.spec.ts
git commit -m "test(custom-effects): add E2E tests for custom effects CRUD and search"
```

---

### Task 12: Run E2E Tests & Fix Issues

**Step 1: Run type check**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make check`
Expected: No type errors

**Step 2: Run E2E tests**

Run: `cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui && make test-e2e`
Expected: All custom effects tests pass

**Step 3: Fix any failures**

If tests fail, debug using Playwright trace viewer or error output. Common issues:
- Selector mismatches — adjust test selectors to match actual rendered DOM
- Timing — add appropriate `waitFor` calls
- API path differences — verify against actual network requests

**Step 4: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix(custom-effects): fix E2E test selectors and timing"
```
