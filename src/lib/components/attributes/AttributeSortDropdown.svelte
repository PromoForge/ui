<script lang="ts">
  import type { SortMode } from '$lib/stores/attributeStore.svelte'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { ArrowDownUp, TrendingUp, ArrowDownAZ, ArrowUpZA } from 'lucide-svelte'

  let {
    sortBy,
    onSort
  }: {
    sortBy: SortMode
    onSort: (mode: SortMode) => void
  } = $props()

  let open = $state(false)

  const options: { mode: SortMode; label: string; icon: typeof TrendingUp }[] = [
    { mode: 'most-used', label: 'Most Used', icon: TrendingUp },
    { mode: 'name-asc', label: 'Name A-Z', icon: ArrowDownAZ },
    { mode: 'name-desc', label: 'Name Z-A', icon: ArrowUpZA }
  ]

  function handleSelect(mode: SortMode) {
    onSort(mode)
    open = false
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger
    class="inline-flex items-center justify-center rounded-md border p-1.5 transition-colors
      {open
        ? 'border-blue-600 text-blue-600'
        : 'border-border bg-white text-foreground hover:border-blue-300 hover:text-blue-500'}"
  >
    <ArrowDownUp size={14} />
  </Popover.Trigger>

  <Popover.Content class="w-44 p-0" align="end" sideOffset={8}>
    <div class="px-3 pt-2.5 pb-1.5">
      <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Sort by
      </span>
    </div>
    <Separator />
    <div class="py-1">
      {#each options as option (option.mode)}
        <button
          class="flex w-full items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors
            {sortBy === option.mode ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}"
          onclick={() => handleSelect(option.mode)}
        >
          <option.icon size={14} />
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  </Popover.Content>
</Popover.Root>
