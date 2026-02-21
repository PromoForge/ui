<script lang="ts">
  import { Chart, Svg, Arc } from 'layerchart'

  let { percentage, class: className = '' }: {
    percentage: number
    class?: string
  } = $props()
</script>

<div class="relative {className}">
  <Chart>
    <Svg center>
      <Arc
        value={percentage}
        domain={[0, 100]}
        innerRadius={0.7}
        cornerRadius={2}
        fill="#F87171"
        track={{ fill: '#E5E7EB' }}
      />
    </Svg>
  </Chart>
  <!-- Centered percentage label -->
  <div class="absolute inset-0 flex items-center justify-center">
    <span class="font-mono text-2xl font-bold text-ink">{percentage}%</span>
  </div>
</div>
