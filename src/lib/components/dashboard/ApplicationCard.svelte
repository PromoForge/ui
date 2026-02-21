<script lang="ts">
  import { QrCode, Pencil } from 'lucide-svelte'
  import type { Application } from '$lib/types'
  import Badge from '$lib/components/ui/Badge.svelte'
  import StatusDot from '$lib/components/ui/StatusDot.svelte'

  let {
    application,
    selected = false,
    onclick
  }: {
    application: Application
    selected?: boolean
    onclick?: () => void
  } = $props()
</script>

<button
  class="group w-full cursor-pointer rounded-lg bg-panel p-4 text-left shadow-card transition-all hover:shadow-md {
    selected ? 'border-l-2 border-primary bg-blue-50/50' : 'border-l-2 border-transparent'
  }"
  onclick={onclick}
>
  <!-- Top row: badge + action icons -->
  <div class="flex items-start justify-between">
    <Badge
      variant={application.environment === 'live' ? 'live' : 'sandbox'}
      label={application.environment === 'live' ? 'LIVE' : 'SANDBOX'}
    />
    <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <span class="rounded p-1 text-gray-400 hover:text-gray-600">
        <QrCode size={14} />
      </span>
      <span class="rounded p-1 text-gray-400 hover:text-gray-600">
        <Pencil size={14} />
      </span>
    </div>
  </div>

  <!-- App name -->
  <h3 class="mt-2 text-base font-bold text-ink">{application.name}</h3>

  <!-- Campaign count -->
  <p class="mt-1 text-xs uppercase tracking-wide text-gray-500">
    {application.campaignCount.toLocaleString()} campaigns
  </p>

  <!-- Status breakdown -->
  <div class="mt-3 flex gap-4">
    <StatusDot color="success" count={application.runningCount} label="running" />
    <StatusDot color="warning" count={application.disabledCount} label="disabled" />
    <StatusDot color="danger" count={application.expiredCount} label="expired" />
  </div>
</button>
