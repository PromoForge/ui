<script lang="ts">
  import { Info } from 'lucide-svelte'
  import Tooltip from './Tooltip.svelte'

  let { label, value, tooltip = '', class: className = '' }: {
    label: string
    value: number
    tooltip?: string
    class?: string
  } = $props()
</script>

<div class="rounded-lg bg-panel p-4 shadow-card {className}">
  <div class="flex items-center gap-1.5 text-xs text-gray-500">
    <span>{label}</span>
    {#if tooltip}
      <Tooltip text={tooltip}>
        <Info size={14} class="text-gray-400" />
      </Tooltip>
    {/if}
  </div>
  <div class="mt-2 font-mono text-3xl font-semibold text-ink">
    {value.toLocaleString()}
  </div>
</div>
