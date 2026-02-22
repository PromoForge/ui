<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte'

  let {
    page,
    pageSize,
    totalCount,
    totalPages,
    onchange,
    class: className = ''
  }: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    onchange: (page: number) => void
    class?: string
  } = $props()

  const rangeStart = $derived((page - 1) * pageSize + 1)
  const rangeEnd = $derived(Math.min(page * pageSize, totalCount))
  const hasPrev = $derived(page > 1)
  const hasNext = $derived(page < totalPages)
</script>

<div class="flex items-center gap-2 text-sm text-gray-500 {className}">
  <span class="font-mono">
    {rangeStart}–{rangeEnd}
  </span>
  <span>of</span>
  <span class="font-mono">{totalCount.toLocaleString()}</span>

  <button
    class="ml-2 rounded-lg p-1 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
    disabled={!hasPrev}
    onclick={() => onchange(page - 1)}
  >
    <ChevronLeft size={16} />
  </button>
  <button
    class="rounded-lg p-1 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
    disabled={!hasNext}
    onclick={() => onchange(page + 1)}
  >
    <ChevronRight size={16} />
  </button>
</div>
