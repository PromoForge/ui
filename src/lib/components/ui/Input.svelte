<script lang="ts">
  let {
    placeholder = '',
    value = $bindable(''),
    oninput,
    class: className = ''
  }: {
    placeholder?: string
    value?: string
    oninput?: (e: Event) => void
    class?: string
  } = $props()
</script>

<input
  type="text"
  {placeholder}
  bind:value
  {oninput}
  class="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-ink placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/20 {className}"
/>
