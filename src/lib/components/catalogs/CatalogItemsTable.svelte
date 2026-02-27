<script lang="ts">
  import type { CatalogItem } from '$lib/api/generated/types.gen'
  import * as Table from '$lib/components/ui/table/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'

  let { items }: { items: CatalogItem[] } = $props()
</script>

<Table.Root>
  <Table.Header>
    <Table.Row class="border-b">
      <Table.Head class="text-xs font-semibold uppercase tracking-wider">
        <Badge variant="outline" class="text-primary border-primary">Product</Badge>
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider">
        <Badge variant="outline" class="text-primary border-primary">SKU</Badge>
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider">
        <Badge variant="outline" class="text-primary border-primary">Price</Badge>
      </Table.Head>
      <Table.Head class="text-xs font-semibold uppercase tracking-wider">
        <Badge class="bg-green-600 text-white hover:bg-green-600">Promo price</Badge>
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each items as item (item.catalogItemId ?? item.sku)}
      <Table.Row class="hover:bg-muted/50">
        <Table.Cell class="text-sm">
          {item.product?.name ?? 'No product'}
        </Table.Cell>
        <Table.Cell class="text-sm text-muted-foreground">
          {item.sku ?? '—'}
        </Table.Cell>
        <Table.Cell class="text-sm text-muted-foreground">
          {item.price != null ? item.price.toFixed(2) : '—'}
        </Table.Cell>
        <Table.Cell class="text-sm text-muted-foreground">
          {item.attributes?.promo_price ?? '–'}
        </Table.Cell>
      </Table.Row>
    {/each}

    {#if items.length === 0}
      <Table.Row>
        <Table.Cell colspan={4} class="h-32 text-center text-muted-foreground">
          No items found.
        </Table.Cell>
      </Table.Row>
    {/if}
  </Table.Body>
</Table.Root>
