<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'

  const appId = $derived(page.params.id)
  const campaignId = $derived(page.params.campaignId)

  $effect(() => {
    if (appId && campaignId) {
      goto(`/applications/${appId}/campaigns/${campaignId}/dashboard`, { replaceState: true })
    }
  })
</script>
