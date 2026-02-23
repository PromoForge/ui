<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    label,
    required = false,
    children
  }: {
    label: string
    required?: boolean
    children: Snippet
  } = $props()
</script>

<div class="flex flex-col gap-1.5">
  <span class="text-sm font-medium text-ink">
    {label}{#if !required}<span class="font-normal text-gray-400"> (optional)</span>{/if}
  </span>
  {@render children()}
</div>
