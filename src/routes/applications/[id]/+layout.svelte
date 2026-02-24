<script lang="ts">
  import { page } from '$app/state'
  import { onMount } from 'svelte'
  import IconRail from '$lib/components/layout/IconRail.svelte'
  import AppContextSidebar from '$lib/components/layout/AppContextSidebar.svelte'
  import CampaignContextSidebar from '$lib/components/layout/CampaignContextSidebar.svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
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

<div class="grid h-screen grid-cols-[56px_1fr]">
  <IconRail {currentPath} />

  <Sidebar.Provider style="--sidebar-width: 220px;">
    {#if inCampaignDetail}
      <CampaignContextSidebar
        applicationId={appId}
        applicationName={applicationStore.selectedApplication?.name ?? ''}
        environment={applicationStore.selectedApplication?.environment ?? 'APPLICATION_ENVIRONMENT_SANDBOX'}
        {campaignId}
        {currentPath}
      />
    {:else}
      <AppContextSidebar
        applicationId={appId}
        applicationName={applicationStore.selectedApplication?.name ?? ''}
        environment={applicationStore.selectedApplication?.environment ?? 'APPLICATION_ENVIRONMENT_SANDBOX'}
        {currentPath}
      />
    {/if}

    <Sidebar.Inset>
      <main class="overflow-y-auto h-full">
        {@render children()}
      </main>
    </Sidebar.Inset>
  </Sidebar.Provider>
</div>
