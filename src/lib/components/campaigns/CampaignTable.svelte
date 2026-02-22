<script lang="ts">
  import type { CampaignListItem } from '$lib/types'
  import CampaignTableRow from './CampaignTableRow.svelte'

  let {
    campaigns,
    oncopy,
    ontemplate,
    class: className = ''
  }: {
    campaigns: CampaignListItem[]
    oncopy: (campaign: CampaignListItem) => void
    ontemplate: (campaign: CampaignListItem) => void
    class?: string
  } = $props()

  const columns = [
    'Campaign Name',
    'Type',
    'ID',
    'Status',
    'Store',
    'Start',
    'End',
    'Coupon Redemptions',
    'Total Discounts',
    'Last Activity',
    'Created',
    'Created By',
    'Copy',
    'Template'
  ]
</script>

<div class="overflow-x-auto rounded-lg border border-border {className}">
  <table class="w-full min-w-[1200px]">
    <thead>
      <tr class="border-b border-border bg-gray-50/80">
        {#each columns as col}
          <th class="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {col}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each campaigns as campaign (campaign.id)}
        <CampaignTableRow {campaign} {oncopy} {ontemplate} />
      {:else}
        <tr>
          <td colspan={columns.length} class="px-3 py-8 text-center text-sm text-gray-400">
            No campaigns found.
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
