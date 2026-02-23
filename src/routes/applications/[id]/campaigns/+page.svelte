<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { campaignListStore } from '$lib/stores/campaignListStore.svelte'
  import Breadcrumb from '$lib/components/ui/app-breadcrumb.svelte'
  import PageActions from '$lib/components/ui/PageActions.svelte'
  import CampaignTabs from '$lib/components/campaigns/CampaignTabs.svelte'
  import CampaignSearchBar from '$lib/components/campaigns/CampaignSearchBar.svelte'
  import CampaignStatusFilters from '$lib/components/campaigns/CampaignStatusFilters.svelte'
  import CampaignTable from '$lib/components/campaigns/CampaignTable.svelte'
  import CampaignPagination from '$lib/components/campaigns/CampaignPagination.svelte'
  import CloneCampaignModal from '$lib/components/campaigns/CloneCampaignModal.svelte'
  import type { CampaignListItem } from '$lib/types'

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: 'Campaigns' }
  ])

  let cloneTarget = $state<CampaignListItem | null>(null)
  let cloneModalOpen = $state(false)

  $effect(() => {
    if (appId) {
      campaignListStore.loadCampaigns(appId)
    }
  })

  function handleCopy(campaign: CampaignListItem) {
    cloneTarget = campaign
    cloneModalOpen = true
  }

  function handleTemplate(_campaign: CampaignListItem) {
    // Future feature — no-op for now
  }

  function handleCloneConfirm(campaignId: string, newName: string) {
    campaignListStore.clone(campaignId, newName)
  }
</script>

<div class="p-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <Breadcrumb items={breadcrumbItems} />
    <PageActions />
  </div>

  <!-- Tabs -->
  <CampaignTabs
    activeTab={campaignListStore.activeTab}
    onchange={(tab) => campaignListStore.setTab(tab)}
    class="mt-6"
  />

  <!-- Tab content -->
  {#if campaignListStore.activeTab === 'calendar'}
    <div class="mt-12 flex flex-col items-center justify-center text-center">
      <h2 class="text-lg font-semibold text-ink">Calendar View</h2>
      <p class="mt-2 text-sm text-gray-500">This view is coming soon.</p>
    </div>
  {:else}
    <!-- Search -->
    <CampaignSearchBar
      value={campaignListStore.searchQuery}
      oninput={(q) => campaignListStore.setSearchQuery(q)}
      class="mt-4 max-w-sm"
    />

    <!-- Filters + Pagination row -->
    <div class="mt-4 flex items-start justify-between">
      <CampaignStatusFilters
        counts={campaignListStore.filterCounts}
        activeFilters={campaignListStore.activeFilters}
        ontoggle={(s) => campaignListStore.toggleFilter(s)}
        onclear={() => campaignListStore.clearFilters()}
      />
      <CampaignPagination
        page={campaignListStore.page}
        pageSize={campaignListStore.pageSize}
        totalCount={campaignListStore.totalCount}
        totalPages={campaignListStore.totalPages}
        onchange={(p) => campaignListStore.setPage(p)}
      />
    </div>

    <!-- Table -->
    <CampaignTable
      campaigns={campaignListStore.campaigns}
      oncopy={handleCopy}
      ontemplate={handleTemplate}
      class="mt-4"
    />
  {/if}
</div>

<!-- Clone modal -->
<CloneCampaignModal
  campaign={cloneTarget}
  bind:open={cloneModalOpen}
  onconfirm={handleCloneConfirm}
/>
