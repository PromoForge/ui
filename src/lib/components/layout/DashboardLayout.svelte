<script lang="ts">
  import type { Snippet } from 'svelte'
  import IconRail from './IconRail.svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'

  let { sidebar, children }: {
    sidebar: Snippet
    children: Snippet
  } = $props()
</script>

<div class="grid h-screen grid-cols-[56px_1fr]">
  <IconRail />

  <Sidebar.Provider style="--sidebar-width: 380px;">
    {@render sidebar()}

    <Sidebar.Inset>
      <main class="overflow-y-auto h-full">
        {@render children()}
      </main>
    </Sidebar.Inset>
  </Sidebar.Provider>
</div>
