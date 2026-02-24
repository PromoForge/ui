<script lang="ts">
  import { Chart, Svg, Arc } from 'layerchart'
  import { TrendingUp, TrendingDown } from 'lucide-svelte'
  import type { PastWeekSummary } from '$lib/types'
  import { formatCurrency, formatPercent } from '$lib/utils'
  import * as Card from '$lib/components/ui/card/index.js'

  let { summary, class: className = '' }: {
    summary: PastWeekSummary
    class?: string
  } = $props()
</script>

<Card.Root class="flex flex-col {className}">
  <Card.Header class="pb-0">
    <Card.Title class="text-sm font-semibold text-foreground">Past 7 Days</Card.Title>
  </Card.Header>
  <Card.Content class="flex flex-1 flex-col items-center pt-3">
    <!-- Donut -->
    <div class="relative mx-auto h-28 w-28">
      <Chart>
        <Svg center>
          <Arc
            value={summary.influenceRate}
            domain={[0, 100]}
            innerRadius={0.72}
            cornerRadius={3}
            fill="#F87171"
            track={{ fill: 'var(--color-muted)' }}
          />
        </Svg>
      </Chart>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-[10px] font-medium text-muted-foreground">Influence Rate</span>
        <span class="font-mono text-xl font-bold text-foreground">{summary.influenceRate}%</span>
      </div>
    </div>

    <!-- Metrics -->
    <div class="mt-4 w-full space-y-3">
      <div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">Total Revenue</span>
          <span class="flex items-center gap-1 text-[10px] font-medium {summary.revenueChange >= 0 ? 'text-success' : 'text-destructive'}">
            {#if summary.revenueChange >= 0}
              <TrendingUp size={10} />
            {:else}
              <TrendingDown size={10} />
            {/if}
            {formatPercent(Math.abs(summary.revenueChange))}
          </span>
        </div>
        <span class="font-mono text-sm font-semibold text-foreground">
          {formatCurrency(summary.totalRevenue)}
        </span>
      </div>
      <div class="h-px bg-border"></div>
      <div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">Influenced Revenue</span>
          <span class="flex items-center gap-1 text-[10px] font-medium {summary.influencedChange >= 0 ? 'text-success' : 'text-destructive'}">
            {#if summary.influencedChange >= 0}
              <TrendingUp size={10} />
            {:else}
              <TrendingDown size={10} />
            {/if}
            {formatPercent(Math.abs(summary.influencedChange))}
          </span>
        </div>
        <span class="font-mono text-sm font-semibold text-foreground">
          {formatCurrency(summary.influencedRevenue)}
        </span>
      </div>
    </div>
  </Card.Content>
</Card.Root>
