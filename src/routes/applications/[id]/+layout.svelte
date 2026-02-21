<script lang="ts">
  import { page } from '$app/state'
  import { onMount } from 'svelte'
  import IconRail from '$lib/components/layout/IconRail.svelte'
  import ApplicationContextPanel from '$lib/components/layout/ApplicationContextPanel.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'

  let { children } = $props()

  const appId = $derived(page.params.id ?? '')
  const currentPath = $derived(page.url.pathname)

  onMount(() => {
    applicationStore.loadApplications()
  })

  $effect(() => {
    if (appId) {
      applicationStore.selectApplication(appId)
    }
  })
</script>

<div class="grid h-screen grid-cols-[56px_220px_1fr]">
  <IconRail activeHref="/" />

  <aside class="overflow-y-auto border-r border-border bg-panel">
    <ApplicationContextPanel
      applicationId={appId}
      applicationName={applicationStore.selectedApplication?.name ?? ''}
      environment={applicationStore.selectedApplication?.environment ?? 'live'}
      {currentPath}
    />
  </aside>

  <main class="overflow-y-auto bg-surface">
    {@render children()}
  </main>
</div>
