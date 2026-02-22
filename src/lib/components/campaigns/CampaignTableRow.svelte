<script lang="ts">
  import { Copy, FileText } from 'lucide-svelte'
  import type { CampaignListItem, CampaignType } from '$lib/types'
  import { formatDate, formatCurrency, formatNumber } from '$lib/utils'

  let {
    campaign,
    oncopy,
    ontemplate
  }: {
    campaign: CampaignListItem
    oncopy: (campaign: CampaignListItem) => void
    ontemplate: (campaign: CampaignListItem) => void
  } = $props()

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    running: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700',
    disabled: 'bg-gray-100 text-gray-600'
  }

  const typeIcons: Record<CampaignType, string> = {
    discount: '%',
    coupon: 'C',
    loyalty: 'L',
    giveaway: 'G'
  }
</script>

<tr class="border-b border-border hover:bg-gray-50/50">
  <td class="whitespace-nowrap px-3 py-3 text-sm font-medium">
    <a
      href="/applications/{campaign.applicationId}/campaigns/{campaign.id}/dashboard"
      class="text-ink hover:text-primary hover:underline"
    >
      {campaign.name}
    </a>
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-center">
    <span class="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-semibold text-gray-600">
      {typeIcons[campaign.type]}
    </span>
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500 font-mono">
    {campaign.id}
  </td>
  <td class="whitespace-nowrap px-3 py-3">
    <span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide {statusColors[campaign.status]}">
      {campaign.status}
    </span>
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {campaign.store}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {formatDate(campaign.startDate)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {formatDate(campaign.endDate)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500 font-mono text-right">
    {formatNumber(campaign.couponRedemptions)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500 font-mono text-right">
    {formatCurrency(campaign.totalDiscounts)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {formatDate(campaign.lastActivity)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {formatDate(campaign.createdAt)}
  </td>
  <td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
    {campaign.createdBy}
  </td>
  <td class="whitespace-nowrap px-3 py-2 text-center">
    <button
      class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      title="Copy campaign"
      onclick={() => oncopy(campaign)}
    >
      <Copy size={15} />
    </button>
  </td>
  <td class="whitespace-nowrap px-3 py-2 text-center">
    <button
      class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      title="Save as template"
      onclick={() => ontemplate(campaign)}
    >
      <FileText size={15} />
    </button>
  </td>
</tr>
