<script lang="ts">
  import { Search } from 'lucide-svelte'

  let {
    value = $bindable(''),
    oninput,
    class: className = ''
  }: {
    value?: string
    oninput?: (query: string) => void
    class?: string
  } = $props()

  let debounceTimer: ReturnType<typeof setTimeout>

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement
    value = target.value
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      oninput?.(value)
    }, 300)
  }
</script>

<div class="relative {className}">
  <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
  <input
    type="text"
    placeholder="Campaign name, tags or id"
    {value}
    oninput={handleInput}
    class="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
  />
</div>
