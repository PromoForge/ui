<script lang="ts">
  let { variant, label, class: className = '' }: {
    variant: 'live' | 'sandbox'
    label: string
    class?: string
  } = $props()

  const variantClasses: Record<string, string> = {
    live: 'bg-success text-white',
    sandbox: 'bg-sandbox text-white'
  }
</script>

<span
  class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide {variantClasses[variant]} {className}"
>
  {label}
</span>
