<script lang="ts">
  import { Chart, Svg, Area, Spline, Axis, Highlight, Tooltip, LinearGradient } from 'layerchart'
  import { scaleTime, scaleLinear } from 'd3-scale'
  import { format } from 'date-fns'
  import type { RevenueDataPoint } from '$lib/types'
  import { abbreviateNumber, formatCurrency } from '$lib/utils'
  import * as Card from '$lib/components/ui/card/index.js'

  let { data, class: className = '' }: {
    data: RevenueDataPoint[]
    class?: string
  } = $props()

  const chartData = $derived(
    data.map((d) => ({ ...d, dateObj: new Date(d.date) }))
  )
</script>

<Card.Root class={className}>
  <Card.Header class="pb-2">
    <Card.Title class="text-sm font-semibold text-foreground">Revenue Overview</Card.Title>
  </Card.Header>
  <Card.Content class="pt-0">
    <div class="h-72">
      <Chart
        data={chartData}
        x="dateObj"
        xScale={scaleTime()}
        y="revenue"
        yScale={scaleLinear()}
        yDomain={[0, null]}
        yNice
        padding={{ left: 56, bottom: 28, top: 8, right: 12 }}
        tooltip={{ mode: 'bisect-x' }}
      >
        <Svg>
          <LinearGradient id="revenueGradient" from="#F87171" to="#F87171" fromOpacity={0.3} toOpacity={0.02} vertical />
          <Axis
            placement="left"
            format={(d) => abbreviateNumber(d)}
            rule
            tickCount={5}
          />
          <Axis
            placement="bottom"
            format={(d) => format(d, 'MMM d')}
            rule
          />
          <Area fill="url(#revenueGradient)" tweened={{ duration: 600 }} />
          <Spline stroke="#F87171" strokeWidth={2} fill="none" tweened={{ duration: 600 }} />
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
  </Card.Content>
</Card.Root>
