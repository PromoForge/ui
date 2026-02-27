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
