<script lang="ts">
  import { Info } from 'lucide-svelte'
  import type { RevenueSummaryRow } from '$lib/types'
  import { formatCurrency, formatPercent } from '$lib/utils'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

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
      tooltip: 'Percentage of total revenue that was influenced by promotions'
    }
  }

  function formatCell(row: RevenueSummaryRow, key: string): string {
    const value = row[key as keyof RevenueSummaryRow] as number
    if (row.label === 'Influence Rate') return formatPercent(value)
    return formatCurrency(value)
  }
</script>

<Card.Root class={className}>
  <Card.Content class="p-0">
    <Table.Root>
      <Table.Header>
        <Table.Row class="hover:bg-transparent">
          <Table.Head class="w-52"></Table.Head>
          {#each columns as col}
            <Table.Head class="text-right text-[10px] font-semibold uppercase tracking-wide">
              {col.label}
            </Table.Head>
          {/each}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each rows as row}
          <Table.Row>
            <Table.Cell class="py-3.5">
              <div class="flex items-center gap-2">
                {#if rowMeta[row.label]?.color}
                  <span class="inline-block h-2.5 w-2.5 rounded-sm {rowMeta[row.label].color}"></span>
                {/if}
                <span class="text-sm font-medium text-foreground">{row.label}</span>
                {#if rowMeta[row.label]?.tooltip}
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      <Info size={14} class="text-muted-foreground/60" />
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      <p class="max-w-48 text-xs">{rowMeta[row.label].tooltip}</p>
                    </Tooltip.Content>
                  </Tooltip.Root>
                {/if}
              </div>
            </Table.Cell>
            {#each columns as col}
              <Table.Cell class="py-3.5 text-right font-mono text-sm">
                {formatCell(row, col.key)}
              </Table.Cell>
            {/each}
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Card.Content>
</Card.Root>
