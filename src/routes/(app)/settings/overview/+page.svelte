<script lang="ts">
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { onMount } from 'svelte'
  import ApplicationDetailsForm from '$lib/components/settings/ApplicationDetailsForm.svelte'
  import PromotionEngineSettings from '$lib/components/settings/PromotionEngineSettings.svelte'
  import AdvancedSettings from '$lib/components/settings/AdvancedSettings.svelte'

  onMount(() => {
    applicationStore.loadApplications()
  })
</script>

<div class="p-8 space-y-8">
  <div>
    <h1 class="text-2xl font-semibold">Overview</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Manage your application settings, promotion engine configuration, and advanced options.
    </p>
  </div>

  {#if applicationStore.selectedApplication}
    <section>
      <h2 class="text-lg font-medium mb-4">Application Details</h2>
      <ApplicationDetailsForm application={applicationStore.selectedApplication} />
    </section>

    <section>
      <h2 class="text-lg font-medium mb-4">Promotion Engine</h2>
      <PromotionEngineSettings application={applicationStore.selectedApplication} />
    </section>

    <section>
      <h2 class="text-lg font-medium mb-4">Advanced</h2>
      <AdvancedSettings application={applicationStore.selectedApplication} />
    </section>
  {:else if applicationStore.loading}
    <p class="text-muted-foreground">Loading application...</p>
  {:else}
    <p class="text-muted-foreground">No application selected. Go to the dashboard and select one.</p>
  {/if}
</div>
