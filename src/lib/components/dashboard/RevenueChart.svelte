<script lang="ts">
  import { Chart, Svg, Area, Spline, Axis, Highlight, Tooltip } from 'layerchart'
  import { scaleTime, scaleLinear } from 'd3-scale'
  import { format } from 'date-fns'
  import { fly } from 'svelte/transition'
  import type { RevenueDataPoint } from '$lib/types'
  import { abbreviateNumber, formatCurrency } from '$lib/utils'

  let { data, class: className = '' }: {
    data: RevenueDataPoint[]
    class?: string
  } = $props()

  const chartData = $derived(
    data.map((d) => ({ ...d, dateObj: new Date(d.date) }))
  )
</script>

<div
  class="h-full w-full rounded-lg bg-panel p-4 shadow-card {className}"
  in:fly={{ y: 40, duration: 600 }}
>
  <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Revenue Overview</h3>
  <div class="h-[calc(100%-28px)]">
    <Chart
      data={chartData}
      x="dateObj"
      xScale={scaleTime()}
      y="revenue"
      yScale={scaleLinear()}
      yDomain={[0, null]}
      yNice
      padding={{ left: 60, bottom: 30, top: 10, right: 10 }}
      tooltip={{ mode: 'bisect-x' }}
    >
      <Svg>
        <Axis placement="left" format={(d) => abbreviateNumber(d)} />
        <Axis placement="bottom" format={(d) => format(d, 'MMM d')} />
        <Area fill="#F87171" fillOpacity={0.2} />
        <Spline stroke="#F87171" strokeWidth={2} fill="none" />
        <Highlight points lines />
      </Svg>
      <Tooltip.Root let:data>
        {#if data}
          <Tooltip.Header>{format(data.dateObj, 'MMM d, yyyy')}</Tooltip.Header>
          <Tooltip.Item label="Revenue" value={formatCurrency(data.revenue)} />
        {/if}
      </Tooltip.Root>
    </Chart>
  </div>
</div>
