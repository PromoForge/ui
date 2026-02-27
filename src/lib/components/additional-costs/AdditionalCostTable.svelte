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
