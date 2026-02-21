<script lang="ts">
  import type { Campaign } from '$lib/types'
  import { formatDate } from '$lib/utils'

  let { campaign }: { campaign: Campaign } = $props()

  const statusColors: Record<string, string> = {
    running: 'bg-success',
    disabled: 'bg-warning',
    expired: 'bg-danger'
  }

  const envColors: Record<string, string> = {
    'KSA PRODUCTION': 'bg-success',
    'UAE PRODUCTION': 'bg-success',
    'KSA SANDBOX': 'bg-sandbox',
    'UAE SANDBOX': 'bg-sandbox'
  }
</script>

<div class="rounded-lg bg-panel p-3 shadow-card">
  <!-- App badge -->
  <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-400">
    <span class="inline-block h-2 w-2 rounded-sm {envColors[campaign.applicationName] ?? 'bg-gray-300'}"></span>
    {campaign.applicationName}
  </div>

  <!-- Campaign name with status dot -->
  <div class="mt-1.5 flex items-center gap-1.5">
    <span class="inline-block h-2 w-2 rounded-full {statusColors[campaign.status]}"></span>
    <span class="text-sm font-medium text-ink">{campaign.name}</span>
  </div>

  <!-- Updated info -->
  <p class="mt-1 text-[11px] text-gray-400">
    Updated {formatDate(campaign.updatedAt)} by {campaign.updatedBy}
  </p>
</div>
