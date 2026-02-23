<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { Info } from 'lucide-svelte'

  let {
    label,
    value,
    tooltip = '',
    class: className = ''
  }: {
    label: string
    value: number
    tooltip?: string
    class?: string
  } = $props()
</script>

<Card.Root class={className}>
  <Card.Content class="p-4">
    <div class="flex items-center gap-1 text-xs text-muted-foreground">
      {label}
      {#if tooltip}
        <Tooltip.Root>
          <Tooltip.Trigger>
            <Info size={14} class="text-muted-foreground" />
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>{tooltip}</p>
          </Tooltip.Content>
        </Tooltip.Root>
      {/if}
    </div>
    <div class="font-mono text-3xl font-semibold text-foreground">
      {value.toLocaleString()}
    </div>
  </Card.Content>
</Card.Root>
