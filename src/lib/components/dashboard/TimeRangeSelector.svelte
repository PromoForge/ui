<script lang="ts">
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js'
  import type { TimeRange } from '$lib/types'

  let {
    value,
    onChange,
    class: className = ''
  }: {
    value: TimeRange
    onChange: (range: TimeRange) => void
    class?: string
  } = $props()

  const options: { label: string; value: TimeRange }[] = [
    { label: 'Custom', value: 'custom' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '3M', value: '3m' },
    { label: '6M', value: '6m' },
    { label: 'YTD', value: 'ytd' },
    { label: 'Max', value: 'max' }
  ]
</script>

<div class="flex justify-end {className}">
  <ToggleGroup.Root
    type="single"
    variant="outline"
    size="sm"
    {value}
    onValueChange={(v) => { if (v) onChange(v as TimeRange) }}
  >
    {#each options as opt (opt.value)}
      <ToggleGroup.Item value={opt.value} aria-label={opt.label}>
        {opt.label}
      </ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>
</div>
