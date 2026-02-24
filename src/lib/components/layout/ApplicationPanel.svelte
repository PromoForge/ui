<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { getRecentCampaigns } from '$lib/services/campaignService'
  import type { Campaign } from '$lib/types'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import ApplicationCard from '$lib/components/dashboard/ApplicationCard.svelte'
  import CampaignCard from '$lib/components/dashboard/CampaignCard.svelte'
  import CreateApplicationForm from '$lib/components/applications/CreateApplicationForm.svelte'

  let recentCampaigns = $state<Campaign[]>([])
  let showCreateForm = $state(false)

  // Derive selected app from route param when on detail page, else from store
  const selectedAppId = $derived(page.params.id ?? applicationStore.selectedId)

  onMount(async () => {
    await applicationStore.loadApplications()
    recentCampaigns = await getRecentCampaigns(8)
  })
</script>

<div class="flex flex-col gap-4 p-4">
  <!-- Search + Create -->
  <div class="flex gap-2">
    <Input
      placeholder="Search Applications"
      value={applicationStore.searchQuery}
      oninput={(e) => applicationStore.setSearchQuery((e.target as HTMLInputElement).value)}
      class="flex-1"
    />
    <Button size="sm" onclick={() => (showCreateForm = true)}>+ Create</Button>
  </div>

  <!-- Application cards -->
  <div class="flex flex-col gap-3">
    {#each applicationStore.filteredApplications as app (app.id)}
      <ApplicationCard
        application={app}
        selected={selectedAppId === String(app.id)}
        href="/applications/{app.id}"
        onclick={() => applicationStore.selectApplication(String(app.id))}
        onedit={() => goto(`/applications/${app.id}/settings-app`)}
      />
    {/each}
  </div>

  <!-- Recently Updated Campaigns -->
  <div class="mt-4">
    <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
      Recently Updated Campaigns
    </h3>
    <div class="flex flex-col gap-2">
      {#each recentCampaigns as campaign (campaign.id)}
        <CampaignCard {campaign} />
      {/each}
    </div>
  </div>

  <CreateApplicationForm bind:open={showCreateForm} />
</div>
