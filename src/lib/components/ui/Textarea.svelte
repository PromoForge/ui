<script lang="ts">
  let {
    placeholder = '',
    value = $bindable(''),
    rows = 3,
    class: className = ''
  }: {
    placeholder?: string
    value?: string
    rows?: number
    class?: string
  } = $props()
</script>

<textarea
  {placeholder}
  bind:value
  {rows}
  class="w-full resize-none rounded-lg bg-gray-100 px-3 py-2 text-sm text-ink placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/20 {className}"
></textarea>
