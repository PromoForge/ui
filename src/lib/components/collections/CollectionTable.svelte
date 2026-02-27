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
