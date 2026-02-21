<script lang="ts">
  import { Info, X } from 'lucide-svelte'

  let { message, class: className = '' }: {
    message: string
    class?: string
  } = $props()

  let visible = $state(true)
</script>

{#if visible}
  <div class="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 {className}">
    <div class="flex items-center gap-2">
      <Info size={16} />
      <span>{message}</span>
    </div>
    <button onclick={() => visible = false} class="text-blue-400 hover:text-blue-600">
      <X size={16} />
    </button>
  </div>
{/if}
