<script lang="ts">
  import { page } from '$app/state'
  import { campaignDetailStore } from '$lib/stores/campaignDetailStore.svelte'

  let { children } = $props()

  const campaignId = $derived(page.params.campaignId ?? '')

  $effect(() => {
    if (campaignId) {
      campaignDetailStore.loadCampaign(campaignId)
    }
    return () => {
      campaignDetailStore.clear()
    }
  })
</script>

{@render children()}
