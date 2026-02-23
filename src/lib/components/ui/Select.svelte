<script lang="ts">
  let {
    value = $bindable(''),
    options = [],
    class: className = ''
  }: {
    value?: string
    options?: { value: string; label: string }[]
    class?: string
  } = $props()
</script>

<select
  bind:value
  class="w-full appearance-none rounded-lg bg-gray-100 px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/20 {className}"
>
  {#each options as option (option.value)}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
