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
