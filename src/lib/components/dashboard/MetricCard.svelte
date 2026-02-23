<script lang="ts">
  import {
    Info,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    DollarSign,
    MousePointerClick,
    Tag,
    Calculator,
    ShoppingCart,
    Ticket
  } from 'lucide-svelte'
  import type { AppDetailMetric } from '$lib/types'
  import { formatCurrency, formatNumber, formatPercent } from '$lib/utils'

  let { metric, class: className = '' }: {
    metric: AppDetailMetric
    class?: string
  } = $props()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iconMap: Record<string, any> = {
    'dollar-sign': DollarSign,
    'mouse-pointer-click': MousePointerClick,
    'tag': Tag,
    'calculator': Calculator,
    'shopping-cart': ShoppingCart,
    'ticket': Ticket
  }

  const icon = $derived(iconMap[metric.icon])

  function formatValue(value: number, formatAs: 'currency' | 'number' | 'percent'): string {
    switch (formatAs) {
      case 'currency': return formatCurrency(value)
      case 'number': return formatNumber(value)
      case 'percent': return formatPercent(value)
    }
  }
</script>

<div class="rounded-lg bg-card shadow-card {className}">
  <!-- Header -->
  <div class="flex items-center justify-between px-4 pt-4 pb-3">
    <div class="flex items-center gap-2">
      {#if icon}
        {@const Icon = icon}
        <Icon size={16} class="text-gray-400" />
      {/if}
      <span class="text-sm font-semibold text-foreground">{metric.title}</span>
    </div>
    <div class="flex items-center gap-1">
      <button class="rounded p-1 text-gray-400 hover:text-gray-600">
        <Info size={14} />
      </button>
      <button class="rounded p-1 text-gray-400 hover:text-gray-600">
        <ArrowUpRight size={14} />
      </button>
    </div>
  </div>

  <!-- Body with colored left border -->
  <div class="mx-4 mb-4 border-l-4 pl-3 {metric.accentColor}">
    <!-- Total section -->
    <div class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      {metric.total.label}
    </div>
    <div class="mt-1 font-mono text-2xl font-semibold text-foreground">
      {formatValue(metric.total.value, metric.formatAs)}
    </div>
    <div class="mt-1 flex items-center gap-1 text-xs">
      {#if metric.total.change >= 0}
        <TrendingUp size={12} class="text-green-600" />
        <span class="text-green-600">{formatPercent(metric.total.change)}</span>
      {:else}
        <TrendingDown size={12} class="text-red-600" />
        <span class="text-red-600">{formatPercent(Math.abs(metric.total.change))}</span>
      {/if}
      <span class="text-gray-400">{metric.total.period}</span>
    </div>

    <!-- Influenced section (optional) -->
    {#if metric.influenced}
      <div class="mt-4 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        Influenced
      </div>
      <div class="mt-1 flex items-baseline gap-2">
        <span class="font-mono text-2xl font-semibold text-foreground">
          {formatValue(metric.influenced.value, metric.formatAs)}
        </span>
        <span class="text-xs text-gray-500">
          ({formatPercent(metric.influenced.rate)} {metric.influenced.rateLabel})
        </span>
      </div>
      <div class="mt-1 flex items-center gap-1 text-xs">
        {#if metric.influenced.change >= 0}
          <TrendingUp size={12} class="text-green-600" />
          <span class="text-green-600">{formatPercent(metric.influenced.change)}</span>
        {:else}
          <TrendingDown size={12} class="text-red-600" />
          <span class="text-red-600">{formatPercent(Math.abs(metric.influenced.change))}</span>
        {/if}
        <span class="text-gray-400">{metric.influenced.period}</span>
      </div>
    {/if}
  </div>
</div>
