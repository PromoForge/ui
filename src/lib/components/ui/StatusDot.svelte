<script lang="ts">
  let { color, count, label, class: className = '' }: {
    color: 'success' | 'warning' | 'danger'
    count: number
    label: string
    class?: string
  } = $props()

  const colorClasses: Record<string, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger'
  }
</script>

<span class="inline-flex items-center gap-1.5 text-xs text-gray-500 {className}">
  <span class="inline-block h-2 w-2 rounded-full {colorClasses[color]}"></span>
  <span class="font-mono text-ink">{count.toLocaleString()}</span>
  {label}
</span>
