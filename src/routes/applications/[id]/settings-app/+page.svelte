<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import Breadcrumb from '$lib/components/ui/app-breadcrumb.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import ApplicationDetailsForm from '$lib/components/settings/ApplicationDetailsForm.svelte'

  const appId = $derived(page.params.id)
  const app = $derived(applicationStore.selectedApplication)
  const appName = $derived(app?.name ?? 'Application')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: 'Settings' }
  ])

  // Sub-tab nav — only "Details" active for now
  type SettingsTab = 'details'
  let activeTab = $state<SettingsTab>('details')

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'details', label: 'Details' }
  ]
</script>

<div class="p-6">
  <Breadcrumb items={breadcrumbItems} />

  <div class="mt-6 flex gap-8">
    <!-- Left sub-nav -->
    <nav class="w-48 shrink-0">
      <h3 class="text-sm font-semibold text-foreground">Settings</h3>
      <div class="mt-1 flex flex-col gap-0.5">
        {#each tabs as tab (tab.id)}
          <Button
            variant={activeTab === tab.id ? 'secondary' : 'ghost'}
            size="sm"
            class="justify-start"
            onclick={() => (activeTab = tab.id)}
          >
            {tab.label}
          </Button>
        {/each}
      </div>
    </nav>

    <!-- Right content -->
    <div class="flex-1">
      {#if activeTab === 'details' && app}
        <ApplicationDetailsForm application={app} />
      {/if}
    </div>
  </div>
</div>
