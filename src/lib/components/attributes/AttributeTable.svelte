<script lang="ts">
  import type { Attribute } from '$lib/api/generated/types.gen'
  import { ENTITY_LABELS, TYPE_LABELS } from '$lib/stores/attributeStore.svelte'
  import * as Table from '$lib/components/ui/table/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

  let {
    attributes
  }: {
    attributes: Attribute[]
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
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Switch
                checked={attr.editable ?? false}
                disabled
              />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Coming soon</p>
            </Tooltip.Content>
          </Tooltip.Root>
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
