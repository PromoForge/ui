<script lang="ts">
  import IconRail from '$lib/components/layout/IconRail.svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import SettingsSidebar from './SettingsSidebar.svelte'

  let { children } = $props()
</script>

<div class="grid h-screen grid-cols-[56px_1fr]">
  <IconRail />

  <Sidebar.Provider style="--sidebar-width: 260px;">
    <SettingsSidebar />

    <Sidebar.Inset>
      <main class="overflow-y-auto h-full">
        {@render children()}
      </main>
    </Sidebar.Inset>
  </Sidebar.Provider>
</div>
