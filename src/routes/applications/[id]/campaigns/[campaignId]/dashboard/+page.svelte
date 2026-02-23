<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { campaignDetailStore } from '$lib/stores/campaignDetailStore.svelte'
  import Breadcrumb from '$lib/components/ui/app-breadcrumb.svelte'
  import CampaignActivationBanner from '$lib/components/campaigns/CampaignActivationBanner.svelte'
  import CampaignDetailsCard from '$lib/components/campaigns/CampaignDetailsCard.svelte'
  import CampaignStateCard from '$lib/components/campaigns/CampaignStateCard.svelte'
  import CampaignScheduleCard from '$lib/components/campaigns/CampaignScheduleCard.svelte'
  import CampaignRulesCard from '$lib/components/campaigns/CampaignRulesCard.svelte'
  import CampaignBudgetsCard from '$lib/components/campaigns/CampaignBudgetsCard.svelte'

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')
  const campaign = $derived(campaignDetailStore.campaign)

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: campaign?.name ?? 'Campaign' }
  ])
</script>

<div class="p-6">
  <Breadcrumb items={breadcrumbItems} />

  {#if campaign}
    <CampaignActivationBanner class="mt-6" />

    <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Left column -->
      <div class="space-y-6">
        <CampaignDetailsCard {campaign} />
        <CampaignRulesCard rules={campaign.rules} />
      </div>

      <!-- Right column -->
      <div class="space-y-6">
        <CampaignStateCard status={campaign.status} />
        <CampaignScheduleCard schedule={campaign.schedule} />
        <CampaignBudgetsCard budgets={campaign.budgets} />
      </div>
    </div>
  {:else if campaignDetailStore.loading}
    <div class="mt-12 flex justify-center">
      <p class="text-sm text-gray-400">Loading campaign...</p>
    </div>
  {:else}
    <div class="mt-12 flex flex-col items-center justify-center text-center">
      <h2 class="text-lg font-semibold text-ink">Campaign not found</h2>
      <p class="mt-2 text-sm text-gray-500">The requested campaign could not be loaded.</p>
    </div>
  {/if}
</div>
