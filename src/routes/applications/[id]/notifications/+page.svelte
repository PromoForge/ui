<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import Breadcrumb from '$lib/components/ui/app-breadcrumb.svelte'

  const appId = $derived(page.params.id)
  const appName = $derived(applicationStore.selectedApplication?.name ?? 'Application')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: 'Notifications' }
  ])
</script>

<div class="p-6">
  <Breadcrumb items={breadcrumbItems} />

  <div class="mt-12 flex flex-col items-center justify-center text-center">
    <h2 class="text-lg font-semibold text-ink">Notifications</h2>
    <p class="mt-2 text-sm text-gray-500">This section is coming soon.</p>
  </div>
</div>
