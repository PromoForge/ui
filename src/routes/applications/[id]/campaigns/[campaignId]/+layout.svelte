<script lang="ts">
  import { page } from '$app/state'
  import { onDestroy } from 'svelte'
  import { campaignDetailStore } from '$lib/stores/campaignDetailStore.svelte'

  let { children } = $props()

  const campaignId = $derived(page.params.campaignId ?? '')

  $effect.pre(() => {
    if (campaignId) {
      campaignDetailStore.loadCampaign(campaignId)
    }
  })

  onDestroy(() => {
    campaignDetailStore.clear()
  })
</script>

{@render children()}
