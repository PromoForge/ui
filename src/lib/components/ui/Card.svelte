<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children, class: className = '' }: {
    children: Snippet
    class?: string
  } = $props()
</script>

<div class="rounded-lg bg-panel p-4 shadow-card {className}">
  {@render children()}
</div>
