<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    variant = 'primary',
    size = 'md',
    onclick,
    children,
    class: className = ''
  }: {
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md'
    onclick?: () => void
    children: Snippet
    class?: string
  } = $props()

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors rounded-full'

  const variantClasses: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-gray-100 text-ink hover:bg-gray-200',
    ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
  }

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm'
  }
</script>

<button
  class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
  onclick={onclick}
>
  {@render children()}
</button>
