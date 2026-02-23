<script lang="ts">
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
</script>

<div class="p-6">
  <h1 class="text-xl font-bold text-foreground">My Account Dashboard</h1>
  <p class="mt-2 text-sm text-gray-500">
    Select an application from the sidebar to view its dashboard.
  </p>

  {#if applicationStore.selectedApplication}
    <div class="mt-6">
      <a
        href="/applications/{applicationStore.selectedId}"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Open {applicationStore.selectedApplication.name}
      </a>
    </div>
  {/if}
</div>
