<script lang="ts">
  import { Info } from 'lucide-svelte'
  import type { RevenueSummaryRow } from '$lib/types'
  import { formatCurrency, formatPercent } from '$lib/utils'
  import Tooltip from '$lib/components/ui/Tooltip.svelte'

  let { rows, class: className = '' }: {
    rows: RevenueSummaryRow[]
    class?: string
  } = $props()

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' }).toUpperCase()

  const columns = [
    { key: 'yesterday', label: 'YESTERDAY' },
    { key: 'past7Days', label: 'PAST 7 DAYS' },
    { key: 'pastMonth', label: 'PAST MONTH' },
    { key: 'currentMonth', label: currentMonthName },
    { key: 'past3Months', label: 'PAST 3 MONTHS' }
  ] as const

  const rowMeta: Record<string, { color: string; tooltip: string }> = {
    'Total Revenue': {
      color: 'bg-primary',
      tooltip: 'Total revenue from all transactions in this period'
    },
    'Influenced Revenue': {
      color: 'bg-coral',
      tooltip: 'Revenue from transactions that used a promotion'
    },
    'Influence Rate': {
      color: '',
      tooltip: ''
    }
  }

  function formatCell(row: RevenueSummaryRow, key: string): string {
    const value = row[key as keyof RevenueSummaryRow] as number
    if (row.label === 'Influence Rate') return formatPercent(value)
    return formatCurrency(value)
  }
</script>

<div class="rounded-lg bg-panel p-4 shadow-card {className}">
  <table class="w-full">
    <thead>
      <tr class="border-b border-border">
        <th class="pb-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400"></th>
        {#each columns as col}
          <th class="pb-3 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {col.label}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr class="border-b border-border last:border-b-0 hover:bg-gray-50">
          <td class="py-3 pr-4">
            <div class="flex items-center gap-2">
              {#if rowMeta[row.label]?.color}
                <span class="inline-block h-2.5 w-2.5 rounded-sm {rowMeta[row.label].color}"></span>
              {/if}
              <span class="text-sm font-medium text-ink">{row.label}</span>
              {#if rowMeta[row.label]?.tooltip}
                <Tooltip text={rowMeta[row.label].tooltip}>
                  <Info size={14} class="text-gray-400" />
                </Tooltip>
              {/if}
            </div>
          </td>
          {#each columns as col}
            <td class="py-3 text-right font-mono text-sm text-ink">
              {formatCell(row, col.key)}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
