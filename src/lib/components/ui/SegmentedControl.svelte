<script lang="ts">
  let {
    options,
    selected = $bindable(),
    onchange,
    class: className = ''
  }: {
    options: { label: string; value: string }[]
    selected: string
    onchange?: (value: string) => void
    class?: string
  } = $props()
</script>

<div class="inline-flex rounded-lg border border-border bg-panel p-0.5 {className}">
  {#each options as option}
    <button
      class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {
        selected === option.value
          ? 'bg-primary text-white'
          : 'text-gray-500 hover:text-gray-700'
      }"
      onclick={() => {
        selected = option.value
        onchange?.(option.value)
      }}
    >
      {option.label}
    </button>
  {/each}
</div>
