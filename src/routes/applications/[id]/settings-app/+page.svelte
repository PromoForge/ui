<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import Breadcrumb from '$lib/components/ui/app-breadcrumb.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import ApplicationDetailsForm from '$lib/components/settings/ApplicationDetailsForm.svelte'
  import PromotionEngineSettings from '$lib/components/settings/PromotionEngineSettings.svelte'
  import AdvancedSettings from '$lib/components/settings/AdvancedSettings.svelte'
  import { FileText, Cog, Shield } from 'lucide-svelte'

  const appId = $derived(page.params.id)
  const app = $derived(applicationStore.selectedApplication)
  const appName = $derived(app?.name ?? 'Application')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: 'Settings' }
  ])

  type SettingsTab = 'details' | 'engine' | 'advanced'
  let activeTab = $state<SettingsTab>('details')

  const tabs: { id: SettingsTab; label: string; icon: typeof FileText }[] = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'engine', label: 'Promotion Engine', icon: Cog },
    { id: 'advanced', label: 'Advanced', icon: Shield }
  ]
</script>

<div class="p-6">
  <Breadcrumb items={breadcrumbItems} />

  <div class="mt-6 flex gap-8">
    <!-- Left sub-nav -->
    <nav class="w-48 shrink-0">
      <h3 class="text-sm font-semibold text-foreground">Settings</h3>
      <div class="mt-2 flex flex-col gap-0.5">
        {#each tabs as tab (tab.id)}
          <Button
            variant={activeTab === tab.id ? 'secondary' : 'ghost'}
            size="sm"
            class="justify-start gap-2"
            onclick={() => (activeTab = tab.id)}
          >
            <tab.icon class="size-3.5 {activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground'}" />
            {tab.label}
          </Button>
        {/each}
      </div>
    </nav>

    <!-- Right content -->
    <div class="flex-1 min-w-0">
      {#if app}
        {#if activeTab === 'details'}
          <ApplicationDetailsForm application={app} />
        {:else if activeTab === 'engine'}
          <PromotionEngineSettings application={app} />
        {:else if activeTab === 'advanced'}
          <AdvancedSettings application={app} />
        {/if}
      {/if}
    </div>
  </div>
</div>
