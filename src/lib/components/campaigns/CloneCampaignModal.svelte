<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
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

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Copy Campaign</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-4">
      <div class="flex flex-col gap-1.5">
        <Label for="clone-name" class="text-sm font-medium">Campaign name</Label>
        <Input id="clone-name" bind:value={cloneName} />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => open = false}>Cancel</Button>
      <Button onclick={handleConfirm}>Confirm</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
