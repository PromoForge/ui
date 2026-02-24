<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { Info } from 'lucide-svelte'

  let {
    label,
    value,
    tooltip = '',
    accentColor = 'text-primary',
    class: className = ''
  }: {
    label: string
    value: number
    tooltip?: string
    accentColor?: string
    class?: string
  } = $props()
</script>

<Card.Root class="relative overflow-hidden {className}">
  <Card.Content class="p-5">
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium text-muted-foreground">{label}</span>
      {#if tooltip}
        <Tooltip.Root>
          <Tooltip.Trigger>
            <Info size={14} class="text-muted-foreground/60" />
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p class="max-w-48 text-xs">{tooltip}</p>
          </Tooltip.Content>
        </Tooltip.Root>
      {/if}
    </div>
    <div class="mt-1 font-mono text-3xl font-bold {accentColor}">
      {value.toLocaleString()}
    </div>
  </Card.Content>
</Card.Root>
