<script lang="ts">
  import AppShell from '$lib/components/layout/AppShell.svelte'
  import ApplicationPanel from '$lib/components/layout/ApplicationPanel.svelte'

  let { children } = $props()
</script>

<AppShell>
  {#snippet sidebar()}
    <ApplicationPanel />
  {/snippet}
  {@render children()}
</AppShell>
