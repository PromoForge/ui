<script lang="ts">
  import { TrendingUp } from 'lucide-svelte'
  import type { PastWeekSummary } from '$lib/types'
  import { formatCurrency, formatPercent } from '$lib/utils'
  import DonutChart from './DonutChart.svelte'

  let { summary, class: className = '' }: {
    summary: PastWeekSummary
    class?: string
  } = $props()
</script>

<div class="rounded-lg bg-card p-4 shadow-card {className}">
  <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-400">Past 7 Days</h3>

  <!-- Donut chart -->
  <div class="mx-auto my-4 h-28 w-28">
    <DonutChart percentage={summary.influenceRate} class="h-full w-full" />
  </div>

  <!-- Metrics -->
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-xs text-gray-500">Total Revenue</span>
      <div class="flex items-center gap-1">
        <span class="font-mono text-sm font-semibold text-foreground">{formatCurrency(summary.totalRevenue)}</span>
        <span class="flex items-center text-[10px] text-success">
          <TrendingUp size={10} />
          {formatPercent(summary.revenueChange)}
        </span>
      </div>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-xs text-gray-500">Influenced Revenue</span>
      <div class="flex items-center gap-1">
        <span class="font-mono text-sm font-semibold text-foreground">{formatCurrency(summary.influencedRevenue)}</span>
        <span class="flex items-center text-[10px] text-success">
          <TrendingUp size={10} />
          {formatPercent(summary.influencedChange)}
        </span>
      </div>
    </div>
  </div>
</div>
