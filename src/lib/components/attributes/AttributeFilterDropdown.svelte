<script lang="ts">
  import { ENTITY_LABELS, TYPE_LABELS, type FilterState } from '$lib/stores/attributeStore.svelte'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { Filter, ChevronRight, ArrowLeft } from 'lucide-svelte'

  let {
    filters,
    onToggle,
    activeFilterCount
  }: {
    filters: FilterState
    onToggle: (category: keyof FilterState, value: string) => void
    activeFilterCount: number
  } = $props()

  let open = $state(false)
  let activeCategory = $state<keyof FilterState | null>(null)
  let lastCategory = $state<keyof FilterState>('entity')

  // Update lastCategory when activeCategory changes to non-null
  $effect(() => {
    if (activeCategory) {
      lastCategory = activeCategory
    }
  })

  // Reset to category list when closing
  $effect(() => {
    if (!open) {
      activeCategory = null
    }
  })

  const categories: { key: keyof FilterState; label: string }[] = [
    { key: 'entity', label: 'Entity' },
    { key: 'type', label: 'Type' },
    { key: 'visibility', label: 'Visibility' }
  ]

  function getOptionsForCategory(cat: keyof FilterState): { value: string; label: string }[] {
    switch (cat) {
      case 'entity':
        return Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }))
      case 'type':
        return Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
      case 'visibility':
        return [
          { value: 'visible', label: 'Visible' },
          { value: 'hidden', label: 'Hidden' }
        ]
    }
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger
    class="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors relative
      {open
        ? 'border-blue-600 text-blue-600'
        : 'border-border bg-white text-foreground hover:border-blue-300 hover:text-blue-500'}"
  >
    <Filter size={14} />
    Filter
    {#if activeFilterCount > 0}
      <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
        {activeFilterCount}
      </span>
    {/if}
  </Popover.Trigger>

  <Popover.Content class="w-56 p-0" align="end" sideOffset={8}>
    <div class="overflow-hidden">
      <!-- Two panels that slide left/right -->
      <div
        class="flex transition-transform duration-200 ease-out"
        style="transform: translateX({activeCategory ? '-100%' : '0'}); width: 200%;"
      >
        <!-- Level 1: Category list -->
        <div class="w-1/2 py-1">
          {#each categories as cat (cat.key)}
            <button
              class="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-slate-50 cursor-pointer"
              onclick={() => (activeCategory = cat.key)}
            >
              <span>{cat.label}</span>
              <div class="flex items-center gap-1">
                {#if filters[cat.key].size > 0}
                  <span class="text-xs text-blue-600">{filters[cat.key].size}</span>
                {/if}
                <ChevronRight size={14} class="text-muted-foreground" />
              </div>
            </button>
          {/each}
        </div>

        <!-- Level 2: Options list -->
        <div class="w-1/2">
          <div class="flex items-center gap-2 px-3 py-2.5 border-b">
            <button
              class="p-0.5 rounded hover:bg-slate-100 cursor-pointer"
              onclick={() => (activeCategory = null)}
            >
              <ArrowLeft size={14} />
            </button>
            <span class="text-sm font-medium">
              {categories.find((c) => c.key === lastCategory)?.label}
            </span>
          </div>
          <div class="max-h-64 overflow-y-auto py-1">
            {#each getOptionsForCategory(lastCategory) as option (option.value)}
              {@const checked = filters[lastCategory].has(option.value)}
              <button
                class="flex w-full items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors
                  {checked ? 'bg-indigo-50' : 'hover:bg-slate-50'}"
                onclick={() => onToggle(lastCategory, option.value)}
              >
                <Checkbox
                  {checked}
                  class="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span>{option.label}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
