<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { getRecentCampaigns } from '$lib/services/campaignService'
  import type { Campaign } from '$lib/types'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import ApplicationCard from '$lib/components/dashboard/ApplicationCard.svelte'
  import CampaignCard from '$lib/components/dashboard/CampaignCard.svelte'
  import CreateApplicationForm from '$lib/components/applications/CreateApplicationForm.svelte'

  let recentCampaigns = $state<Campaign[]>([])
  let showCreateForm = $state(false)

  const selectedAppId = $derived(page.params.id ?? applicationStore.selectedId)

  onMount(async () => {
    await applicationStore.loadApplications()
    recentCampaigns = await getRecentCampaigns(8)
  })
</script>

<Sidebar.Root collapsible="none" class="border-r">
  <Sidebar.Header class="p-4">
    <div class="flex gap-2">
      <Input
        placeholder="Search Applications"
        value={applicationStore.searchQuery}
        oninput={(e: Event) => applicationStore.setSearchQuery((e.target as HTMLInputElement).value)}
        class="flex-1"
      />
      <Button size="sm" onclick={() => (showCreateForm = true)}>+ Create</Button>
    </div>
  </Sidebar.Header>

  <Sidebar.Content>
    <!-- Application cards -->
    <Sidebar.Group>
      <Sidebar.GroupContent>
        <div class="flex flex-col gap-3 px-4">
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
      </Sidebar.GroupContent>
    </Sidebar.Group>

    <!-- Recently Updated Campaigns -->
    <Sidebar.Group>
      <Sidebar.GroupLabel class="text-[10px] font-semibold uppercase tracking-wide px-4">
        Recently Updated Campaigns
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <div class="flex flex-col gap-2 px-4">
          {#each recentCampaigns as campaign (campaign.id)}
            <CampaignCard {campaign} />
          {/each}
        </div>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
</Sidebar.Root>

<CreateApplicationForm bind:open={showCreateForm} />
