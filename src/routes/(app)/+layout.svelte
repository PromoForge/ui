<script lang="ts">
  import AppShell from '$lib/components/layout/AppShell.svelte'
  import DashboardSidebar from '$lib/components/layout/DashboardSidebar.svelte'

  let { children } = $props()
</script>

<AppShell>
  {#snippet sidebar()}
    <DashboardSidebar />
  {/snippet}
  {@render children()}
</AppShell>
