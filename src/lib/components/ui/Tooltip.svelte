<script lang="ts">
  import type { Snippet } from 'svelte'

  let { text, children }: {
    text: string
    children: Snippet
  } = $props()
</script>

<span class="group relative inline-flex">
  {@render children()}
  <span
    class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
  >
    {text}
  </span>
</span>
