<script lang="ts">
  import { MoreVertical } from 'lucide-svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import type { CampaignStatus } from '$lib/types'

  let {
    status,
    class: className = ''
  }: {
    status: CampaignStatus
    class?: string
  } = $props()

  const statusConfig: Record<string, { label: string; dotColor: string; description: string }> = {
    scheduled: {
      label: 'Scheduled',
      dotColor: 'bg-blue-500',
      description: 'The campaign is scheduled to start. Rules will be validated.'
    },
    running: {
      label: 'Running',
      dotColor: 'bg-green-500',
      description: 'The campaign is currently running. Rules will be validated.'
    },
    expired: {
      label: 'Expired',
      dotColor: 'bg-red-500',
      description: 'The campaign has expired and is no longer active.'
    },
    disabled: {
      label: 'Disabled',
      dotColor: 'bg-gray-400',
      description: 'The campaign is disabled and will not process any rules.'
    }
  }

  const config = $derived(statusConfig[status])
</script>

<Card.Root class={className}>
  <Card.Content>
  <h3 class="text-sm font-semibold text-foreground">State</h3>

  <div class="mt-3 flex items-center gap-2">
    <span class="h-2.5 w-2.5 rounded-full {config.dotColor}"></span>
    <span class="text-sm font-semibold text-foreground">{config.label}</span>
  </div>

  <p class="mt-2 text-sm text-gray-500">{config.description}</p>

  <div class="mt-4 flex items-center gap-2">
    <Button variant="secondary" size="sm">Disable Campaign</Button>
    <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
      <MoreVertical size={16} />
    </button>
  </div>
  </Card.Content>
</Card.Root>
