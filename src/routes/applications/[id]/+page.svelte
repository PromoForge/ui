<script lang="ts">
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'

  const appId = $derived(page.params.id)

  $effect(() => {
    if (appId) {
      applicationStore.selectApplication(appId)
      goto('/', { replaceState: true })
    }
  })
</script>

<div class="flex h-64 items-center justify-center">
  <span class="text-sm text-muted-foreground">Redirecting to dashboard...</span>
</div>
