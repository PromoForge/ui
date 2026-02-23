<script lang="ts">
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js'

  let {
    items,
    class: className = ''
  }: {
    items: { label: string; href?: string }[]
    class?: string
  } = $props()
</script>

<Breadcrumb.Root class={className}>
  <Breadcrumb.List>
    {#each items as item, i (i)}
      {#if i > 0}
        <Breadcrumb.Separator />
      {/if}
      <Breadcrumb.Item>
        {#if item.href}
          <Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
        {:else}
          <Breadcrumb.Page>{item.label}</Breadcrumb.Page>
        {/if}
      </Breadcrumb.Item>
    {/each}
  </Breadcrumb.List>
</Breadcrumb.Root>
