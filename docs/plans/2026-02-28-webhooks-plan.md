# Webhooks Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full CRUD Webhooks page with list table, search, pagination, and a wide two-column create/edit sheet with headers builder, parameters builder, CodeMirror payload editor, curl preview, and test functionality.

**Architecture:** Service layer wraps generated SDK → Svelte 5 runes store manages all state → List page with table + Sheet overlay for create/edit. The sheet uses a wide two-column layout (form left, payload/preview/test right) with composable sub-components.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, shadcn-svelte (Bits UI), Tailwind CSS v4, CodeMirror 6, TypeScript, Playwright E2E

---

### Task 1: Install CodeMirror dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

Run:
```bash
bun add codemirror @codemirror/lang-json @codemirror/view @codemirror/state
```

**Step 2: Verify installation**

Run: `bun run build` (or `make build`)
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add codemirror dependencies for webhook payload editor"
```

---

### Task 2: Create webhook service

**Files:**
- Create: `src/lib/services/webhookService.ts`

**Step 1: Write the service**

```typescript
import {
  backstageServiceListWebhooks,
  backstageServiceCreateWebhook,
  backstageServiceGetWebhook,
  backstageServiceUpdateWebhook,
  backstageServiceDeleteWebhook,
  backstageServiceTestWebhook,
} from "$lib/api/generated";
import type {
  Webhook,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  TestWebhookResponse,
} from "$lib/api/generated/types.gen";

export async function listWebhooks(): Promise<{
  data: Webhook[];
  total: number;
}> {
  const { data, error } = await backstageServiceListWebhooks({
    query: { pageSize: 1000 },
  });
  if (error) {
    throw new Error("Failed to load webhooks");
  }
  return {
    data: data?.data ?? [],
    total: data?.totalResultSize ?? 0,
  };
}

export async function getWebhook(webhookId: string): Promise<Webhook> {
  const { data, error } = await backstageServiceGetWebhook({
    path: { webhookId },
  });
  if (error) {
    throw new Error("Failed to load webhook");
  }
  return data!.webhook!;
}

export async function createWebhook(
  request: CreateWebhookRequest,
): Promise<Webhook> {
  const { data, error } = await backstageServiceCreateWebhook({
    body: request,
  });
  if (error) {
    throw new Error("Failed to create webhook");
  }
  return data!.webhook!;
}

export async function updateWebhook(
  webhookId: string,
  request: Omit<UpdateWebhookRequest, "webhookId">,
): Promise<Webhook> {
  const { data, error } = await backstageServiceUpdateWebhook({
    path: { webhookId },
    body: { ...request, webhookId },
  });
  if (error) {
    throw new Error("Failed to update webhook");
  }
  return data!.webhook!;
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  const { error } = await backstageServiceDeleteWebhook({
    path: { webhookId },
  });
  if (error) {
    throw new Error("Failed to delete webhook");
  }
}

export async function testWebhook(
  webhookId: string,
): Promise<TestWebhookResponse> {
  const { data, error } = await backstageServiceTestWebhook({
    path: { webhookId },
    body: { webhookId },
  });
  if (error) {
    throw new Error("Failed to test webhook");
  }
  return data!;
}

export async function copyWebhook(webhookId: string): Promise<Webhook> {
  const original = await getWebhook(webhookId);
  return createWebhook({
    name: `${original.name} (Copy)`,
    description: original.description,
    verb: original.verb,
    url: original.url,
    headers: original.headers,
    parameters: original.parameters,
    payload: original.payload,
    applicationIds: original.connectedApplicationIds,
  });
}
```

**Step 2: Verify types compile**

Run: `make check`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/services/webhookService.ts
git commit -m "feat(webhooks): add webhook service layer"
```

---

### Task 3: Create webhook store

**Files:**
- Create: `src/lib/stores/webhookStore.svelte.ts`

**Step 1: Write the store**

Follow the exact same pattern as `src/lib/stores/catalogStore.svelte.ts`:

```typescript
import {
  listWebhooks,
  createWebhook as createWebhookApi,
  updateWebhook as updateWebhookApi,
  deleteWebhook as deleteWebhookApi,
  testWebhook as testWebhookApi,
  copyWebhook as copyWebhookApi,
} from "$lib/services/webhookService";
import type {
  Webhook,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  TestWebhookResponse,
} from "$lib/api/generated/types.gen";

function createWebhookStore() {
  let webhooks = $state<Webhook[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let searchQuery = $state("");
  let currentPage = $state(1);
  let pageSize = $state(50);
  let createSheetOpen = $state(false);
  let editSheetOpen = $state(false);
  let editingWebhook = $state<Webhook | null>(null);

  const filteredWebhooks = $derived.by(() => {
    let result = webhooks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          (w.name ?? "").toLowerCase().includes(q) ||
          (w.description ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  });

  const totalFiltered = $derived(filteredWebhooks.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalFiltered / pageSize)));
  const paginatedWebhooks = $derived(
    filteredWebhooks.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
  );

  async function loadWebhooks() {
    if (loading) return;
    loading = true;
    error = null;
    try {
      const result = await listWebhooks();
      webhooks = result.data;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load webhooks";
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

  async function addWebhook(request: CreateWebhookRequest): Promise<Webhook> {
    const webhook = await createWebhookApi(request);
    webhooks = [webhook, ...webhooks];
    return webhook;
  }

  function openEditSheet(webhook: Webhook) {
    editingWebhook = webhook;
    editSheetOpen = true;
  }

  function closeEditSheet() {
    editSheetOpen = false;
    editingWebhook = null;
  }

  async function modifyWebhook(
    id: string,
    request: Omit<UpdateWebhookRequest, "webhookId">,
  ): Promise<void> {
    const updated = await updateWebhookApi(id, request);
    webhooks = webhooks.map((w) => (w.id === updated.id ? updated : w));
    if (editingWebhook?.id === updated.id) {
      editingWebhook = updated;
    }
  }

  async function removeWebhook(id: string): Promise<void> {
    await deleteWebhookApi(id);
    webhooks = webhooks.filter((w) => w.id !== id);
  }

  async function duplicateWebhook(id: string): Promise<void> {
    const copied = await copyWebhookApi(id);
    webhooks = [copied, ...webhooks];
  }

  async function testWebhookById(
    id: string,
  ): Promise<TestWebhookResponse> {
    return testWebhookApi(id);
  }

  return {
    get webhooks() { return webhooks; },
    get loading() { return loading; },
    get error() { return error; },
    get searchQuery() { return searchQuery; },
    get currentPage() { return currentPage; },
    get pageSize() { return pageSize; },
    get createSheetOpen() { return createSheetOpen; },
    set createSheetOpen(v: boolean) { createSheetOpen = v; },
    get editSheetOpen() { return editSheetOpen; },
    set editSheetOpen(v: boolean) { editSheetOpen = v; },
    get editingWebhook() { return editingWebhook; },
    get filteredWebhooks() { return filteredWebhooks; },
    get paginatedWebhooks() { return paginatedWebhooks; },
    get totalFiltered() { return totalFiltered; },
    get totalPages() { return totalPages; },

    loadWebhooks,
    setSearchQuery,
    setPage,
    addWebhook,
    openEditSheet,
    closeEditSheet,
    modifyWebhook,
    removeWebhook,
    duplicateWebhook,
    testWebhookById,
  };
}

export const webhookStore = createWebhookStore();
```

**Step 2: Verify types compile**

Run: `make check`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/stores/webhookStore.svelte.ts
git commit -m "feat(webhooks): add webhook store with runes"
```

---

### Task 4: Create WebhookTable component

**Files:**
- Create: `src/lib/components/webhooks/WebhookTable.svelte`

**Step 1: Write the table component**

Follow the pattern from `src/lib/components/catalogs/CatalogTable.svelte`:

```svelte
<script lang="ts">
  import type { Webhook, Application } from '$lib/api/generated/types.gen'
  import * as Table from '$lib/components/ui/table/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { LayoutGrid, Copy } from 'lucide-svelte'

  let {
    webhooks,
    applications = [],
    onEdit,
    onCopy,
  }: {
    webhooks: Webhook[]
    applications?: Application[]
    onEdit?: (webhook: Webhook) => void
    onCopy?: (webhook: Webhook) => void
  } = $props()

  function getVerbLabel(verb: string | undefined): string {
    if (!verb) return '—'
    return verb.replace('WEBHOOK_VERB_', '')
  }

  function getAppDisplay(webhook: Webhook): { label: string; apps: Application[] } {
    const ids = webhook.connectedApplicationIds
    if (!ids || ids.length === 0) {
      return { label: 'All', apps: [] }
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
      <Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Name
      </Table.Head>
      <Table.Head class="w-24 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Verb
      </Table.Head>
      <Table.Head class="w-40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Applications
      </Table.Head>
      <Table.Head class="w-16 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Copy
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each webhooks as webhook (webhook.id)}
      {@const appInfo = getAppDisplay(webhook)}
      <Table.Row class="group hover:bg-muted/50">
        <Table.Cell>
          <button
            class="text-sm font-medium text-primary hover:underline cursor-pointer text-left"
            onclick={() => onEdit?.(webhook)}
          >
            {webhook.name ?? '—'}
          </button>
          {#if webhook.description}
            <p class="text-xs text-muted-foreground mt-0.5">{webhook.description}</p>
          {/if}
        </Table.Cell>
        <Table.Cell class="text-sm text-foreground">
          {getVerbLabel(webhook.verb)}
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
              All
            </div>
          {/if}
        </Table.Cell>
        <Table.Cell>
          <button
            class="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            onclick={() => onCopy?.(webhook)}
          >
            <Copy size={16} />
          </button>
        </Table.Cell>
      </Table.Row>
    {/each}

    {#if webhooks.length === 0}
      <Table.Row>
        <Table.Cell colspan={4} class="h-32 text-center text-muted-foreground">
          No webhooks found.
        </Table.Cell>
      </Table.Row>
    {/if}
  </Table.Body>
</Table.Root>
```

**Step 2: Verify types compile**

Run: `make check`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/components/webhooks/WebhookTable.svelte
git commit -m "feat(webhooks): add webhook table component"
```

---

### Task 5: Create WebhookHeadersInput sub-component

**Files:**
- Create: `src/lib/components/webhooks/WebhookHeadersInput.svelte`

**Step 1: Write the component**

```svelte
<script lang="ts">
  import type { WebhookHeader } from '$lib/api/generated/types.gen'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Trash2, Plus } from 'lucide-svelte'

  let {
    headers = $bindable<WebhookHeader[]>([]),
  }: {
    headers: WebhookHeader[]
  } = $props()

  const DEFAULT_HEADERS: WebhookHeader[] = [
    { key: 'X-UUID', value: '(generated)' },
    { key: 'Content-Type', value: 'application/json' },
  ]

  function addHeader() {
    headers = [...headers, { key: '', value: '' }]
  }

  function removeHeader(index: number) {
    headers = headers.filter((_, i) => i !== index)
  }

  function updateHeader(index: number, field: 'key' | 'value', val: string) {
    headers = headers.map((h, i) => (i === index ? { ...h, [field]: val } : h))
  }
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-base font-medium">Headers</h3>
    <p class="text-sm text-muted-foreground mt-1">
      Specify any request headers required by the destination as key-value pairs.
    </p>
  </div>

  <div class="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
    <Label class="text-xs font-medium text-muted-foreground">Key</Label>
    <Label class="text-xs font-medium text-muted-foreground">Value</Label>
    <div></div>
  </div>

  <!-- Default headers (read-only) -->
  {#each DEFAULT_HEADERS as dh}
    <div class="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
      <Input value={dh.key} disabled class="bg-muted text-muted-foreground" />
      <Input value={dh.value} disabled class="bg-muted text-muted-foreground" />
      <div></div>
    </div>
  {/each}

  <!-- User headers -->
  {#each headers as header, i (i)}
    <div class="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
      <Input
        value={header.key ?? ''}
        placeholder="Header key"
        oninput={(e: Event) => updateHeader(i, 'key', (e.target as HTMLInputElement).value)}
      />
      <Input
        value={header.value ?? ''}
        placeholder="Header value"
        oninput={(e: Event) => updateHeader(i, 'value', (e.target as HTMLInputElement).value)}
      />
      <button
        class="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
        onclick={() => removeHeader(i)}
      >
        <Trash2 size={14} />
      </button>
    </div>
  {/each}

  <Button variant="ghost" size="sm" class="text-primary" onclick={addHeader}>
    <Plus size={14} class="mr-1" />
    Add Header
  </Button>
</div>
```

**Step 2: Verify types compile**

Run: `make check`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/components/webhooks/WebhookHeadersInput.svelte
git commit -m "feat(webhooks): add headers input sub-component"
```

---

### Task 6: Create WebhookParametersInput sub-component

**Files:**
- Create: `src/lib/components/webhooks/WebhookParametersInput.svelte`

**Step 1: Write the component**

```svelte
<script lang="ts">
  import type { WebhookParameter } from '$lib/api/generated/types.gen'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Trash2, Plus } from 'lucide-svelte'

  let {
    parameters = $bindable<WebhookParameter[]>([]),
  }: {
    parameters: WebhookParameter[]
  } = $props()

  const PARAM_TYPES = [
    { value: 'WEBHOOK_PARAMETER_TYPE_STRING', label: 'String' },
    { value: 'WEBHOOK_PARAMETER_TYPE_NUMBER', label: 'Number' },
    { value: 'WEBHOOK_PARAMETER_TYPE_BOOLEAN', label: 'Boolean' },
    { value: 'WEBHOOK_PARAMETER_TYPE_TIME', label: 'Time' },
    { value: 'WEBHOOK_PARAMETER_TYPE_LONG_STRING', label: 'Long String' },
  ] as const

  function addParameter() {
    parameters = [
      ...parameters,
      { type: 'WEBHOOK_PARAMETER_TYPE_STRING', name: '', description: '' },
    ]
  }

  function removeParameter(index: number) {
    parameters = parameters.filter((_, i) => i !== index)
  }

  function updateParameter(index: number, field: keyof WebhookParameter, val: string) {
    parameters = parameters.map((p, i) => (i === index ? { ...p, [field]: val } : p))
  }

  function getTypeLabel(type: string | undefined): string {
    return PARAM_TYPES.find((t) => t.value === type)?.label ?? 'String'
  }
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-base font-medium">Parameters (optional)</h3>
    <p class="text-sm text-muted-foreground mt-1">
      Specify the information to send to the destination as key-value pairs.
    </p>
  </div>

  {#each parameters as param, i (i)}
    <div class="relative rounded-md border p-4 space-y-3">
      <button
        class="absolute top-3 right-3 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
        onclick={() => removeParameter(i)}
      >
        <Trash2 size={14} />
      </button>

      <div class="space-y-1.5 pr-8">
        <label class="text-sm font-medium">Type</label>
        <Select.Root
          type="single"
          value={param.type ?? 'WEBHOOK_PARAMETER_TYPE_STRING'}
          onValueChange={(val) => { if (val) updateParameter(i, 'type', val) }}
        >
          <Select.Trigger class="w-full">
            {getTypeLabel(param.type)}
          </Select.Trigger>
          <Select.Content>
            {#each PARAM_TYPES as pt (pt.value)}
              <Select.Item value={pt.value}>{pt.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium">Name</label>
        <Input
          value={param.name ?? ''}
          placeholder="Parameter name"
          oninput={(e: Event) => updateParameter(i, 'name', (e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium">Description (optional)</label>
        <Input
          value={param.description ?? ''}
          placeholder="Parameter description"
          oninput={(e: Event) =>
            updateParameter(i, 'description', (e.target as HTMLInputElement).value)}
        />
      </div>
    </div>
  {/each}

  <Button variant="ghost" size="sm" class="text-primary" onclick={addParameter}>
    <Plus size={14} class="mr-1" />
    Add Parameter
  </Button>
</div>
```

**Step 2: Verify types compile**

Run: `make check`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/components/webhooks/WebhookParametersInput.svelte
git commit -m "feat(webhooks): add parameters input sub-component"
```

---

### Task 7: Create WebhookPayloadEditor sub-component

**Files:**
- Create: `src/lib/components/webhooks/WebhookPayloadEditor.svelte`

**Step 1: Write the component**

This uses CodeMirror 6. Since Svelte 5 needs careful lifecycle handling, use `onMount`/`onDestroy`:

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

  const EXAMPLE_TEMPLATE = `{
  "attributePayload": "\${$Profile.Attributes.Name}",
  "parameterPayload": "\${$ParameterName}"
}`

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

  // Sync external value changes into the editor
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
    <p class="text-sm text-muted-foreground mt-1">
      Enter the request payload as JSON content in the format displayed below.
      The parameter names in the payload and the Parameters section must match.
    </p>
  </div>

  <div class="rounded-md bg-muted p-3">
    <pre class="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{EXAMPLE_TEMPLATE}</pre>
  </div>

  <div bind:this={editorContainer} class="min-h-[200px]"></div>
</div>
```

**Step 2: Verify build**

Run: `make check`
Expected: No type errors (CodeMirror types might need `@types` — check output)

**Step 3: Commit**

```bash
git add src/lib/components/webhooks/WebhookPayloadEditor.svelte
git commit -m "feat(webhooks): add CodeMirror payload editor sub-component"
```

---

### Task 8: Create WebhookPreview sub-component

**Files:**
- Create: `src/lib/components/webhooks/WebhookPreview.svelte`

**Step 1: Write the component**

```svelte
<script lang="ts">
  import type { WebhookHeader } from '$lib/api/generated/types.gen'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Copy } from 'lucide-svelte'

  let {
    verb = 'POST',
    url = '',
    headers = [],
    payload = '',
  }: {
    verb?: string
    url?: string
    headers?: WebhookHeader[]
    payload?: string
  } = $props()

  function getVerbLabel(v: string): string {
    return v.replace('WEBHOOK_VERB_', '') || 'POST'
  }

  const curlCommand = $derived.by(() => {
    const parts: string[] = ['curl']

    const method = getVerbLabel(verb)
    if (method !== 'GET') {
      parts.push(`-X ${method}`)
    }

    // Default headers
    parts.push(`-H 'X-UUID: (generated)'`)
    parts.push(`-H 'Content-Type: application/json'`)

    // User headers
    for (const h of headers) {
      if (h.key?.trim()) {
        parts.push(`-H '${h.key}: ${h.value ?? ''}'`)
      }
    }

    if (payload.trim()) {
      // Escape single quotes in payload for curl
      const escaped = payload.replace(/'/g, "'\\''")
      parts.push(`-d '${escaped}'`)
    }

    parts.push(`'${url || '<URL>'}'`)

    return parts.join(' \\\n  ')
  })

  let copied = $state(false)

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(curlCommand)
      copied = true
      setTimeout(() => { copied = false }, 2000)
    } catch {
      // Clipboard not available
    }
  }
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-base font-medium">Preview</h3>
    <p class="text-sm text-muted-foreground mt-1">
      Preview the information to send to the destination.
    </p>
  </div>

  <div class="rounded-md bg-muted p-3 overflow-x-auto">
    <pre class="text-xs font-mono text-foreground whitespace-pre-wrap">{curlCommand}</pre>
  </div>

  <Button variant="outline" size="sm" onclick={copyToClipboard}>
    <Copy size={14} class="mr-1.5" />
    {copied ? 'Copied!' : 'Copy'}
  </Button>
</div>
```

**Step 2: Verify types compile**

Run: `make check`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/components/webhooks/WebhookPreview.svelte
git commit -m "feat(webhooks): add curl preview sub-component"
```

---

### Task 9: Create WebhookTestSection sub-component

**Files:**
- Create: `src/lib/components/webhooks/WebhookTestSection.svelte`

**Step 1: Write the component**

```svelte
<script lang="ts">
  import type { TestWebhookResponse } from '$lib/api/generated/types.gen'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Send, CheckCircle, XCircle } from 'lucide-svelte'

  let {
    webhookId = undefined,
    onTest,
  }: {
    webhookId?: string
    onTest?: (id: string) => Promise<TestWebhookResponse>
  } = $props()

  let testing = $state(false)
  let testResult = $state<TestWebhookResponse | null>(null)
  let testError = $state<string | null>(null)

  const testSuccess = $derived(
    testResult !== null && (testResult.statusCode ?? 0) >= 200 && (testResult.statusCode ?? 0) < 300,
  )

  async function handleTest() {
    if (!webhookId || !onTest) return
    testing = true
    testResult = null
    testError = null
    try {
      testResult = await onTest(webhookId)
    } catch (e) {
      testError = e instanceof Error ? e.message : 'Test failed'
    } finally {
      testing = false
    }
  }
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-base font-medium">Test</h3>
  </div>

  <div class="rounded-md bg-warning/10 border border-warning/30 px-3 py-2 text-sm text-warning">
    This step is required for saving changes.
  </div>

  <p class="text-sm text-muted-foreground">
    Test the webhook to validate the URL and headers.
  </p>

  <Button
    variant="outline"
    size="sm"
    onclick={handleTest}
    disabled={!webhookId || testing}
  >
    <Send size={14} class="mr-1.5" />
    {testing ? 'Testing...' : 'Test Webhook'}
  </Button>

  {#if testResult}
    <div
      class="rounded-md px-3 py-2 text-sm {testSuccess
        ? 'bg-success/10 text-success'
        : 'bg-destructive/10 text-destructive'}"
    >
      <div class="flex items-center gap-1.5">
        {#if testSuccess}
          <CheckCircle size={14} />
          <span>Status: {testResult.statusCode}</span>
        {:else}
          <XCircle size={14} />
          <span>Status: {testResult.statusCode ?? 'Error'}</span>
        {/if}
      </div>
      {#if testResult.responseBody}
        <pre class="mt-2 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
{testResult.responseBody}
        </pre>
      {/if}
    </div>
  {/if}

  {#if testError}
    <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {testError}
    </div>
  {/if}
</div>
```

**Step 2: Verify types compile**

Run: `make check`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/components/webhooks/WebhookTestSection.svelte
git commit -m "feat(webhooks): add test section sub-component"
```

---

### Task 10: Create WebhookSheet component

**Files:**
- Create: `src/lib/components/webhooks/WebhookSheet.svelte`

**Step 1: Write the component**

This is the main sheet that orchestrates all sub-components in a two-column layout. Follow the pattern from `src/lib/components/catalogs/CatalogSheet.svelte` but with the wide two-column layout:

```svelte
<script lang="ts">
  import type {
    Application,
    Webhook,
    WebhookHeader,
    WebhookParameter,
    CreateWebhookRequest,
    UpdateWebhookRequest,
    TestWebhookResponse,
  } from '$lib/api/generated/types.gen'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { CircleHelp, Trash2, Copy } from 'lucide-svelte'
  import WebhookHeadersInput from './WebhookHeadersInput.svelte'
  import WebhookParametersInput from './WebhookParametersInput.svelte'
  import WebhookPayloadEditor from './WebhookPayloadEditor.svelte'
  import WebhookPreview from './WebhookPreview.svelte'
  import WebhookTestSection from './WebhookTestSection.svelte'

  let {
    mode = 'create',
    webhook = undefined,
    open = false,
    onOpenChange,
    onSubmit,
    onUpdate,
    onDelete,
    onCopy,
    onTest,
    applications = [],
  }: {
    mode?: 'create' | 'edit'
    webhook?: Webhook
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit?: (request: CreateWebhookRequest) => Promise<Webhook>
    onUpdate?: (request: Omit<UpdateWebhookRequest, 'webhookId'>) => Promise<void>
    onDelete?: (webhookId: string) => Promise<void>
    onCopy?: (webhookId: string) => Promise<void>
    onTest?: (webhookId: string) => Promise<TestWebhookResponse>
    applications: Application[]
  } = $props()

  const VERBS = [
    { value: 'WEBHOOK_VERB_DELETE', label: 'DELETE' },
    { value: 'WEBHOOK_VERB_GET', label: 'GET' },
    { value: 'WEBHOOK_VERB_PATCH', label: 'PATCH' },
    { value: 'WEBHOOK_VERB_POST', label: 'POST' },
    { value: 'WEBHOOK_VERB_PUT', label: 'PUT' },
  ] as const

  // Form state
  let name = $state('')
  let description = $state('')
  let verb = $state<string>('WEBHOOK_VERB_POST')
  let url = $state('')
  let userHeaders = $state<WebhookHeader[]>([])
  let parameters = $state<WebhookParameter[]>([])
  let payload = $state('')
  let selectedAppIds = $state<number[]>([])
  let appDropdownOpen = $state(false)

  // UI state
  let submitting = $state(false)
  let attempted = $state(false)
  let submitError = $state('')
  let createdWebhookId = $state<string | undefined>(undefined)

  // Delete dialog state
  let deleteDialogOpen = $state(false)
  let deleting = $state(false)
  let deleteError = $state('')

  // Validation
  const nameError = $derived(attempted && !name.trim() ? 'Name is required' : '')
  const urlError = $derived(attempted && !url.trim() ? 'URL is required' : '')

  // The effective webhookId — either from edit mode or after creation
  const effectiveWebhookId = $derived(webhook?.id ?? createdWebhookId)

  function getVerbLabel(v: string): string {
    return VERBS.find((vb) => vb.value === v)?.label ?? 'POST'
  }

  // Pre-populate form in edit mode
  $effect(() => {
    if (mode === 'edit' && webhook && open) {
      name = webhook.name ?? ''
      description = webhook.description ?? ''
      verb = webhook.verb ?? 'WEBHOOK_VERB_POST'
      url = webhook.url ?? ''
      // Separate default headers from user headers
      userHeaders = (webhook.headers ?? []).filter(
        (h) => h.key !== 'X-UUID' && h.key !== 'Content-Type',
      )
      parameters = webhook.parameters ? [...webhook.parameters] : []
      payload = webhook.payload ?? ''
      selectedAppIds = webhook.connectedApplicationIds
        ? [...webhook.connectedApplicationIds]
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

  function resetForm() {
    name = ''
    description = ''
    verb = 'WEBHOOK_VERB_POST'
    url = ''
    userHeaders = []
    parameters = []
    payload = ''
    selectedAppIds = []
    appDropdownOpen = false
    submitting = false
    attempted = false
    submitError = ''
    createdWebhookId = undefined
  }

  function handleCancel() {
    resetForm()
    onOpenChange(false)
  }

  function buildRequest(): CreateWebhookRequest {
    return {
      name: name.trim(),
      description: description.trim() || undefined,
      verb: verb as CreateWebhookRequest['verb'],
      url: url.trim(),
      headers: userHeaders.filter((h) => h.key?.trim()),
      parameters: parameters.filter((p) => p.name?.trim()),
      payload: payload.trim() || undefined,
      applicationIds: selectedAppIds.length > 0 ? selectedAppIds : undefined,
    }
  }

  async function handleSubmit() {
    attempted = true
    submitError = ''
    if (!name.trim() || !url.trim()) return

    submitting = true
    try {
      if (mode === 'create') {
        const created = await onSubmit?.(buildRequest())
        if (created?.id) {
          createdWebhookId = created.id
        }
      } else {
        await onUpdate?.(buildRequest())
      }
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError =
        e instanceof Error
          ? e.message
          : mode === 'create'
            ? 'Failed to create webhook'
            : 'Failed to update webhook'
    } finally {
      submitting = false
    }
  }

  async function handleSaveDraft() {
    attempted = true
    submitError = ''
    if (!name.trim() || !url.trim()) return

    submitting = true
    try {
      const req = buildRequest()
      if (mode === 'create') {
        await onSubmit?.(req)
      } else {
        await onUpdate?.({ ...req, enabled: false })
      }
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError = e instanceof Error ? e.message : 'Failed to save draft'
    } finally {
      submitting = false
    }
  }

  async function handleDelete() {
    if (!webhook?.id) return
    deleting = true
    deleteError = ''
    try {
      await onDelete?.(webhook.id)
      deleteDialogOpen = false
      resetForm()
      onOpenChange(false)
    } catch (e) {
      deleteError = e instanceof Error ? e.message : 'Failed to delete webhook'
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
  <Sheet.Content side="right" class="w-[80vw] sm:max-w-[80vw] flex flex-col">
    <Sheet.Header>
      <Sheet.Title class="sr-only">
        {mode === 'edit' ? 'Edit Webhook' : 'Create Webhook'}
      </Sheet.Title>
    </Sheet.Header>

    <div class="flex-1 overflow-hidden flex">
      <!-- Left column: Form (scrollable) -->
      <div class="flex-[55] overflow-y-auto px-6 py-4 space-y-5 border-r">
        {#if submitError}
          <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </div>
        {/if}

        {#if mode === 'create'}
          <p class="text-sm text-muted-foreground">
            Create a webhook to send information in real time to third-party software.
            Enter the basic properties and request details of the webhook below.
          </p>
        {:else}
          <p class="text-sm text-muted-foreground">
            Edit the request details and payload of the webhook.
          </p>
        {/if}

        <!-- Name -->
        <div class="space-y-1.5">
          <Label class="text-sm font-medium">Name</Label>
          <Input
            value={name}
            oninput={(e: Event) => { name = (e.target as HTMLInputElement).value }}
            class={nameError ? 'border-destructive ring-destructive' : ''}
          />
          {#if nameError}
            <p class="text-xs text-destructive font-medium">{nameError}</p>
          {/if}
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <Label class="text-sm font-medium">Description (optional)</Label>
          <textarea
            class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
            value={description}
            oninput={(e: Event) => { description = (e.target as HTMLTextAreaElement).value }}
          ></textarea>
        </div>

        <!-- Connected Applications -->
        <div class="space-y-2">
          <h3 class="text-base font-medium">Connected Applications</h3>
          <p class="text-sm text-muted-foreground">
            Select the Applications where you want to use the webhook.
            Select none to make the webhook available for use in all Applications.
          </p>
          <Popover.Root bind:open={appDropdownOpen}>
            <Popover.Trigger
              class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <span class={selectedAppIds.length === 0 ? 'text-muted-foreground' : ''}>
                {selectedAppIds.length === 0
                  ? 'All Applications'
                  : `${selectedAppIds.length} selected`}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" class="text-muted-foreground">
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
                    <span class="font-medium">{app.name ?? 'Unnamed'}</span>
                  </button>
                {/each}
                {#if applications.length === 0}
                  <p class="px-3 py-2 text-sm text-muted-foreground">No applications found.</p>
                {/if}
              </div>
            </Popover.Content>
          </Popover.Root>
        </div>

        <Separator />

        <!-- Request Details -->
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-medium">Request details</h3>
            <p class="text-sm text-muted-foreground mt-1">Specify the destination of the webhook.</p>
          </div>

          <!-- Verb -->
          <div class="space-y-1.5">
            <Label class="text-sm font-medium">Verb</Label>
            <Select.Root
              type="single"
              value={verb}
              onValueChange={(val) => { if (val) verb = val }}
            >
              <Select.Trigger class="w-full">
                {getVerbLabel(verb)}
              </Select.Trigger>
              <Select.Content>
                {#each VERBS as v (v.value)}
                  <Select.Item value={v.value}>{v.label}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>

          <!-- URL -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5">
              <Label class="text-sm font-medium">URL</Label>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  <CircleHelp size={14} class="text-muted-foreground" />
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p>The URL receiving the webhook. You can reference attributes here,
                    like ${'${$Application.Attributes.url}'}.</p>
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
            <Input
              value={url}
              placeholder="https://example.com/webhook"
              oninput={(e: Event) => { url = (e.target as HTMLInputElement).value }}
              class={urlError ? 'border-destructive ring-destructive' : ''}
            />
            {#if urlError}
              <p class="text-xs text-destructive font-medium">{urlError}</p>
            {/if}
          </div>
        </div>

        <Separator />

        <!-- Headers -->
        <WebhookHeadersInput bind:headers={userHeaders} />

        <Separator />

        <!-- Parameters -->
        <WebhookParametersInput bind:parameters />

        <!-- Edit-only sections -->
        {#if mode === 'edit'}
          <Separator />

          <!-- Copy -->
          <div class="space-y-2">
            <h3 class="text-base font-medium">Copy (optional)</h3>
            <p class="text-sm text-muted-foreground">
              Copy all the parameters and request details of this webhook to a new webhook.
            </p>
            <Button
              variant="outline"
              onclick={() => { if (webhook?.id) onCopy?.(webhook.id) }}
            >
              <Copy size={14} class="mr-1.5" />
              Copy Webhook
            </Button>
          </div>

          <Separator />

          <!-- Delete -->
          <div class="space-y-2 pt-2">
            <h3 class="text-base font-medium text-destructive">Delete webhook</h3>
            <p class="text-sm text-muted-foreground">
              Permanently delete all information related to the webhook.
            </p>
            <Button
              variant="outline"
              class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              onclick={() => (deleteDialogOpen = true)}
            >
              <Trash2 size={14} class="mr-1.5" />
              Delete Webhook
            </Button>
          </div>
        {/if}
      </div>

      <!-- Right column: Payload / Preview / Test (sticky) -->
      <div class="flex-[45] overflow-y-auto px-6 py-4 space-y-6">
        <WebhookPayloadEditor bind:value={payload} />

        <Separator />

        <WebhookPreview
          verb={verb}
          url={url}
          headers={userHeaders}
          payload={payload}
        />

        <Separator />

        <WebhookTestSection
          webhookId={effectiveWebhookId}
          {onTest}
        />
      </div>
    </div>

    <Sheet.Footer class="border-t px-6 py-4 flex justify-end gap-2">
      <Button variant="ghost" onclick={handleCancel} disabled={submitting}>
        Cancel
      </Button>
      <Button variant="outline" onclick={handleSaveDraft} disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Draft'}
      </Button>
      <Button onclick={handleSubmit} disabled={submitting}>
        {#if submitting}
          {mode === 'edit' ? 'Saving...' : 'Creating...'}
        {:else}
          {mode === 'edit' ? 'Save' : 'Create Webhook'}
        {/if}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>

<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete Webhook</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete {webhook?.name ?? 'this webhook'}?
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
          Delete Webhook
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

**Step 2: Verify types compile**

Run: `make check`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/components/webhooks/WebhookSheet.svelte
git commit -m "feat(webhooks): add main webhook sheet with two-column layout"
```

---

### Task 11: Build the webhooks list page

**Files:**
- Modify: `src/routes/(app)/settings/tools/webhooks/+page.svelte`

**Step 1: Replace the stub page**

Replace the entire contents of the file with:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { webhookStore } from '$lib/stores/webhookStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Plus, ChevronLeft, ChevronRight, Search } from 'lucide-svelte'
  import WebhookTable from '$lib/components/webhooks/WebhookTable.svelte'
  import WebhookSheet from '$lib/components/webhooks/WebhookSheet.svelte'

  onMount(() => {
    webhookStore.loadWebhooks()
    applicationStore.loadApplications()
  })

  const startItem = $derived(
    (webhookStore.currentPage - 1) * webhookStore.pageSize + 1,
  )
  const endItem = $derived(
    Math.min(
      webhookStore.currentPage * webhookStore.pageSize,
      webhookStore.totalFiltered,
    ),
  )
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="flex items-center justify-between px-8 pt-8 pb-2">
    <h1 class="text-2xl font-semibold">Webhooks</h1>
    <Button onclick={() => (webhookStore.createSheetOpen = true)}>
      <Plus size={16} class="mr-1.5" />
      Create Webhook
    </Button>
  </div>

  <!-- Search + Pagination -->
  <div class="px-8 pt-4 space-y-2">
    <div class="flex items-center justify-between">
      <div class="relative w-80">
        <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Webhook or integration name"
          class="pl-9"
          value={webhookStore.searchQuery}
          oninput={(e: Event) =>
            webhookStore.setSearchQuery((e.target as HTMLInputElement).value)}
        />
      </div>
    </div>

    {#if webhookStore.totalFiltered > 0}
      <div class="flex items-center justify-end gap-2">
        <span class="text-sm text-muted-foreground">
          {startItem} – {endItem} of {webhookStore.totalFiltered}
        </span>
        <button
          class="p-1 rounded hover:bg-muted disabled:opacity-30"
          disabled={webhookStore.currentPage <= 1}
          onclick={() => webhookStore.setPage(webhookStore.currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          class="p-1 rounded hover:bg-muted disabled:opacity-30"
          disabled={webhookStore.currentPage >= webhookStore.totalPages}
          onclick={() => webhookStore.setPage(webhookStore.currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    {/if}
  </div>

  <!-- Table -->
  <div class="flex-1 overflow-y-auto px-8 pt-4">
    {#if webhookStore.loading}
      <div class="flex items-center justify-center py-16">
        <p class="text-muted-foreground">Loading webhooks...</p>
      </div>
    {:else if webhookStore.error}
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <p class="text-destructive">{webhookStore.error}</p>
          <Button variant="outline" class="mt-4" onclick={() => webhookStore.loadWebhooks()}>
            Retry
          </Button>
        </div>
      </div>
    {:else}
      <WebhookTable
        webhooks={webhookStore.paginatedWebhooks}
        applications={applicationStore.applications}
        onEdit={(webhook) => webhookStore.openEditSheet(webhook)}
        onCopy={async (webhook) => {
          if (webhook.id) await webhookStore.duplicateWebhook(webhook.id)
        }}
      />
    {/if}
  </div>

  <!-- Create Sheet -->
  <WebhookSheet
    mode="create"
    open={webhookStore.createSheetOpen}
    onOpenChange={(v) => (webhookStore.createSheetOpen = v)}
    onSubmit={async (req) => webhookStore.addWebhook(req)}
    onTest={(id) => webhookStore.testWebhookById(id)}
    applications={applicationStore.applications}
  />

  <!-- Edit Sheet -->
  <WebhookSheet
    mode="edit"
    webhook={webhookStore.editingWebhook ?? undefined}
    open={webhookStore.editSheetOpen}
    onOpenChange={(v) => {
      if (!v) webhookStore.closeEditSheet()
    }}
    onUpdate={async (req) => {
      if (webhookStore.editingWebhook?.id) {
        await webhookStore.modifyWebhook(webhookStore.editingWebhook.id, req)
      }
    }}
    onDelete={async (id) => {
      await webhookStore.removeWebhook(id)
    }}
    onCopy={async (id) => {
      await webhookStore.duplicateWebhook(id)
    }}
    onTest={(id) => webhookStore.testWebhookById(id)}
    applications={applicationStore.applications}
  />
</div>
```

**Step 2: Verify it compiles**

Run: `make check`
Expected: No type errors

**Step 3: Manually verify in browser**

Run: `make dev`
Navigate to `http://localhost:5173/settings/tools/webhooks`
Expected: Page loads with header, search bar, empty table (or list if backend has data)

**Step 4: Commit**

```bash
git add src/routes/\(app\)/settings/tools/webhooks/+page.svelte
git commit -m "feat(webhooks): build webhooks list page replacing stub"
```

---

### Task 12: Integration verification and fixes

**Step 1: Run full type check**

Run: `make check`
Expected: No errors. If there are errors, fix them.

**Step 2: Run build**

Run: `make build`
Expected: Build succeeds with no errors.

**Step 3: Manual smoke test**

Run: `make dev`

Test the following flows manually:
1. Navigate to `/settings/tools/webhooks` — page loads
2. Click "+ Create Webhook" — wide sheet opens with two columns
3. Fill in Name, select a verb, enter a URL — form works
4. Add a header, add a parameter — dynamic rows work
5. Type JSON in the CodeMirror editor — editor works
6. Verify curl preview updates reactively
7. Close the sheet — form resets

Fix any issues found.

**Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix(webhooks): integration fixes from smoke testing"
```

---

### Task 13: Seed webhook test data in E2E setup

**Files:**
- Modify: `e2e/global-setup.ts`
- Modify: `e2e/test-state.ts`

**Step 1: Add webhookIds to TestState**

In `e2e/test-state.ts`, add to the `TestState` interface:

```typescript
export interface TestState {
  applicationId: number;
  applicationName: string;
  attributeIds: number[];
  additionalCostIds: number[];
  collectionIds: number[];
  catalogIds: number[];
  webhookIds: string[];  // <-- add this
}
```

**Step 2: Add webhook seeding to global-setup.ts**

Add the following block before `saveTestState(...)` in `e2e/global-setup.ts`:

```typescript
  // Create test webhooks
  const webhookConfigs = [
    {
      name: "E2E Test Webhook",
      description: "Webhook for E2E display tests",
      verb: "WEBHOOK_VERB_POST",
      url: "https://httpbin.org/post",
      headers: [{ key: "x-test", value: "true" }],
      parameters: [
        {
          type: "WEBHOOK_PARAMETER_TYPE_STRING",
          name: "testParam",
          description: "A test parameter",
        },
      ],
      payload: '{"test": "${$testParam}"}',
      applicationIds: [app.id],
    },
    {
      name: "E2E Editable Webhook",
      description: "Webhook for edit/delete E2E tests",
      verb: "WEBHOOK_VERB_POST",
      url: "https://httpbin.org/post",
      headers: [],
      parameters: [],
      payload: "{}",
      applicationIds: [app.id],
    },
  ];

  const webhookIds: string[] = [];
  for (const config of webhookConfigs) {
    const whRes = await apiPost("/api/v1/webhooks", config, true);
    if (whRes) {
      const wh = whRes.webhook;
      webhookIds.push(wh.id);
      console.log(`Created webhook: ${wh.name} (id=${wh.id})`);
    } else {
      console.log(`Webhook ${config.name} already exists, skipping`);
    }
  }
```

Then update the `saveTestState` call to include `webhookIds`.

**Step 3: Commit**

```bash
git add e2e/global-setup.ts e2e/test-state.ts
git commit -m "test(webhooks): add webhook seed data for E2E tests"
```

---

### Task 14: Write E2E tests

**Files:**
- Create: `e2e/tests/webhooks.spec.ts`

**Step 1: Write the test file**

Follow the pattern from `e2e/tests/cart-item-catalogs.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Webhooks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/tools/webhooks");
    await expect(
      page.getByRole("heading", { name: "Webhooks" })
    ).toBeVisible({ timeout: 15_000 });
    // Wait for seeded webhook to appear
    await expect(page.getByText("E2E Test Webhook")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should display the webhooks page with seeded data", async ({
    page,
  }) => {
    await expect(page.getByText("E2E Test Webhook")).toBeVisible();
    await expect(page.getByText("E2E Editable Webhook")).toBeVisible();

    // Verify table columns
    const table = page.locator("table");
    await expect(table.getByText("Name")).toBeVisible();
    await expect(table.getByText("Verb")).toBeVisible();
    await expect(table.getByText("Applications")).toBeVisible();
    await expect(table.getByText("Copy")).toBeVisible();

    // Verify verb display
    await expect(table.getByText("POST").first()).toBeVisible();
  });

  test("should create a new webhook", async ({ page }) => {
    await page.getByRole("button", { name: "Create Webhook" }).click();

    // Verify sheet opened with intro text
    await expect(
      page.getByText("Create a webhook to send information")
    ).toBeVisible();

    // Fill name
    const nameInput = page
      .getByRole("dialog")
      .locator('input')
      .first();
    await nameInput.fill("E2E Created Webhook");

    // Fill URL
    const urlInput = page
      .getByRole("dialog")
      .locator('input[placeholder="https://example.com/webhook"]');
    await urlInput.fill("https://httpbin.org/post");

    // Submit
    const createPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/webhooks") && req.method() === "POST"
    );
    await page
      .getByRole("button", { name: "Create Webhook" })
      .last()
      .click();

    await createPromise;

    // Should appear in the table
    await expect(page.getByText("E2E Created Webhook")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should edit a webhook", async ({ page }) => {
    // Click webhook name to open edit sheet
    await page.getByText("E2E Editable Webhook").click();

    await expect(
      page.getByText("Edit the request details and payload")
    ).toBeVisible();

    const updatePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/webhooks/") && req.method() === "PUT"
    );

    // Change name
    const nameInput = page
      .getByRole("dialog")
      .locator('input')
      .first();
    await nameInput.clear();
    await nameInput.fill("Updated Webhook");

    await page.getByRole("button", { name: "Save" }).click();
    await updatePromise;

    await expect(page.getByText("Updated Webhook")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should copy a webhook", async ({ page }) => {
    // Find the row with "E2E Test Webhook" and click its copy button
    const row = page.locator("table tbody tr", {
      has: page.getByText("E2E Test Webhook"),
    });

    const copyPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/webhooks") && req.method() === "POST"
    );

    await row.locator("button").last().click();
    await copyPromise;

    await expect(
      page.getByText("E2E Test Webhook (Copy)")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should delete a webhook", async ({ page }) => {
    await expect(page.getByText("Updated Webhook")).toBeVisible();

    // Click webhook name to edit
    await page.getByText("Updated Webhook").click();

    await expect(
      page.getByText("Edit the request details and payload")
    ).toBeVisible();

    // Scroll to and click Delete
    const sheetDeleteButton = page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete Webhook" });
    await sheetDeleteButton.scrollIntoViewIfNeeded();
    await sheetDeleteButton.click();

    // Confirm in dialog
    const dialog = page.getByRole("dialog", { name: "Delete Webhook" });
    await expect(dialog).toBeVisible();

    const deletePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/webhooks/") &&
        req.method() === "DELETE"
    );

    await dialog.getByRole("button", { name: "Delete Webhook" }).click();
    await deletePromise;

    await expect(dialog).toBeHidden({ timeout: 5_000 });
    await expect(page.getByText("Updated Webhook")).toBeHidden({
      timeout: 10_000,
    });
  });

  test("should filter webhooks by search", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Webhook or integration name"
    );
    await searchInput.fill("E2E Test");

    // Should show "E2E Test Webhook" but not unrelated webhooks
    await expect(page.getByText("E2E Test Webhook")).toBeVisible();
    // Clear and search for something that doesn't exist
    await searchInput.clear();
    await searchInput.fill("nonexistent-webhook-xyz");
    await expect(page.getByText("No webhooks found.")).toBeVisible();
  });
});
```

**Step 2: Commit**

```bash
git add e2e/tests/webhooks.spec.ts
git commit -m "test(webhooks): add E2E tests for webhooks CRUD and search"
```

---

### Task 15: Run E2E tests and fix failures

**Step 1: Run the E2E tests**

Run: `make test-e2e`
Expected: All webhook tests pass.

**Step 2: If any tests fail, fix the issues**

Common issues to watch for:
- Sheet dialog selectors may need adjustment (Bits UI portals)
- Timing issues — add `waitForResponse` or increase timeouts
- Table row button selectors for copy action
- CodeMirror may need SSR handling (dynamic import or `ssr: false` check)

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix(webhooks): fix E2E test failures"
```

---

## File Summary

| File | Action |
|------|--------|
| `package.json` | Modify (add codemirror deps) |
| `src/lib/services/webhookService.ts` | Create |
| `src/lib/stores/webhookStore.svelte.ts` | Create |
| `src/lib/components/webhooks/WebhookTable.svelte` | Create |
| `src/lib/components/webhooks/WebhookHeadersInput.svelte` | Create |
| `src/lib/components/webhooks/WebhookParametersInput.svelte` | Create |
| `src/lib/components/webhooks/WebhookPayloadEditor.svelte` | Create |
| `src/lib/components/webhooks/WebhookPreview.svelte` | Create |
| `src/lib/components/webhooks/WebhookTestSection.svelte` | Create |
| `src/lib/components/webhooks/WebhookSheet.svelte` | Create |
| `src/routes/(app)/settings/tools/webhooks/+page.svelte` | Modify (replace stub) |
| `e2e/test-state.ts` | Modify (add webhookIds) |
| `e2e/global-setup.ts` | Modify (add webhook seeding) |
| `e2e/tests/webhooks.spec.ts` | Create |
