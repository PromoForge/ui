<script lang="ts">
  import { page } from '$app/state'
  import { onMount } from 'svelte'
  import IconRail from '$lib/components/layout/IconRail.svelte'
  import ApplicationContextPanel from '$lib/components/layout/ApplicationContextPanel.svelte'
  import CampaignContextPanel from '$lib/components/layout/CampaignContextPanel.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'

  let { children } = $props()

  const appId = $derived(page.params.id ?? '')
  const campaignId = $derived(page.url.pathname.match(/\/campaigns\/([^/]+)/)?.[1] ?? '')
  const currentPath = $derived(page.url.pathname)
  const inCampaignDetail = $derived(campaignId !== '')

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
  <IconRail {currentPath} />

  <aside class="overflow-y-auto border-r border-border bg-card">
    {#if inCampaignDetail}
      <CampaignContextPanel
        applicationId={appId}
        applicationName={applicationStore.selectedApplication?.name ?? ''}
        environment={applicationStore.selectedApplication?.environment ?? 'APPLICATION_ENVIRONMENT_SANDBOX'}
        {campaignId}
        {currentPath}
      />
    {:else}
      <ApplicationContextPanel
        applicationId={appId}
        applicationName={applicationStore.selectedApplication?.name ?? ''}
        environment={applicationStore.selectedApplication?.environment ?? 'APPLICATION_ENVIRONMENT_SANDBOX'}
        {currentPath}
      />
    {/if}
  </aside>

  <main class="overflow-y-auto bg-background">
    {@render children()}
  </main>
</div>
