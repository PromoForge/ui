<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import Breadcrumb from '$lib/components/ui/app-breadcrumb.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
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
    <nav class="flex w-48 shrink-0 flex-col gap-1">
      {#each tabs as tab (tab.id)}
        <Button
          variant={activeTab === tab.id ? 'secondary' : 'ghost'}
          class="justify-start"
          onclick={() => (activeTab = tab.id)}
        >
          {tab.label}
        </Button>
      {/each}
    </nav>

    <Separator orientation="vertical" class="h-auto" />

    <!-- Right content -->
    <div class="flex-1">
      {#if activeTab === 'details' && app}
        <ApplicationDetailsForm application={app} />
      {/if}
    </div>
  </div>
</div>
