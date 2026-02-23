<script lang="ts">
  import { Settings } from 'lucide-svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import type { CampaignDetail } from '$lib/types'

  let {
    campaign,
    class: className = ''
  }: {
    campaign: CampaignDetail
    class?: string
  } = $props()

  const lastUpdatedDate = $derived(
    new Date(campaign.lastUpdatedAt).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  )
</script>

<Card.Root class={className}>
  <Card.Content>
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-semibold text-foreground">Details</h3>
    <button class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
      <Settings size={16} />
    </button>
  </div>

  <div class="mt-3 space-y-1 text-sm text-gray-600">
    <p>{campaign.description}</p>
    <p>{campaign.category}</p>
    <p>{campaign.productList}</p>
  </div>

  <button class="mt-2 text-sm text-primary hover:underline">Go to Details</button>

  <hr class="my-4 border-border" />

  <div class="flex items-center justify-between">
    <h3 class="text-sm font-semibold text-foreground">Tags</h3>
    <button class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
      <Settings size={16} />
    </button>
  </div>

  {#if campaign.tags.length > 0}
    <div class="mt-2 flex flex-wrap gap-1.5">
      {#each campaign.tags as tag}
        <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{tag}</span>
      {/each}
    </div>
  {:else}
    <div class="mt-2 text-sm text-gray-500">
      <p class="font-medium">No tags yet.</p>
      <p class="mt-1 text-xs">To add tags, open <button class="text-primary hover:underline">Details</button>. To generate them automatically, click Autofill.</p>
    </div>
  {/if}

  <p class="mt-4 text-xs text-gray-400">
    Last updated on {lastUpdatedDate} by {campaign.lastUpdatedBy}
  </p>
  </Card.Content>
</Card.Root>
