<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import type { CampaignListItem } from '$lib/types'

  let {
    campaign,
    open = $bindable(false),
    onconfirm
  }: {
    campaign: CampaignListItem | null
    open?: boolean
    onconfirm: (campaignId: string, newName: string) => void
  } = $props()

  let cloneName = $state('')

  $effect(() => {
    if (campaign && open) {
      cloneName = `Copy of ${campaign.name}`
    }
  })

  function handleConfirm() {
    if (campaign && cloneName.trim()) {
      onconfirm(campaign.id, cloneName.trim())
      open = false
    }
  }
</script>

<Modal bind:open title="Copy Campaign">
  <div class="space-y-4">
    <div>
      <label for="clone-name" class="block text-sm font-medium text-gray-700">
        Campaign name
      </label>
      <input
        id="clone-name"
        type="text"
        bind:value={cloneName}
        class="mt-1 w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>

    <div class="flex justify-end gap-2">
      <Button variant="secondary" onclick={() => open = false}>Cancel</Button>
      <Button onclick={handleConfirm}>Confirm</Button>
    </div>
  </div>
</Modal>
