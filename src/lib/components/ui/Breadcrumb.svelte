<script lang="ts">
  import { ChevronRight } from 'lucide-svelte'

  let { items, class: className = '' }: {
    items: Array<{ label: string; href?: string }>
    class?: string
  } = $props()
</script>

<nav class="flex items-center gap-1 text-sm text-gray-500 {className}">
  {#each items as item, i}
    {#if i > 0}
      <ChevronRight size={14} class="text-gray-400" />
    {/if}
    {#if item.href}
      <a href={item.href} class="hover:text-primary">{item.label}</a>
    {:else}
      <span class="font-medium text-ink">{item.label}</span>
    {/if}
  {/each}
</nav>
