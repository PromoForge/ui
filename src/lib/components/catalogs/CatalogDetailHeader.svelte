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
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Catalog Name
      </p>
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
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Catalog ID
      </p>
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
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Connected Applications
      </p>
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
