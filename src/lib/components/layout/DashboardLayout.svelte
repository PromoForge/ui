<script lang="ts">
  import type { Snippet } from 'svelte'
  import IconRail from './IconRail.svelte'

  let { sidebar, children }: {
    sidebar: Snippet
    children: Snippet
  } = $props()
</script>

<div class="grid h-screen grid-cols-[56px_380px_1fr]">
  <IconRail />

  <!-- Zone B: Application Panel -->
  <aside class="overflow-y-auto border-r border-border bg-card">
    {@render sidebar()}
  </aside>

  <!-- Zone C: Main Dashboard -->
  <main class="overflow-y-auto bg-background">
    {@render children()}
  </main>
</div>
