<script lang="ts">
  import { BarChart3 } from 'lucide-svelte'
  import Card from '$lib/components/ui/Card.svelte'
  import type { CampaignBudget } from '$lib/types'
  import { formatNumber } from '$lib/utils'

  let {
    budgets,
    class: className = ''
  }: {
    budgets: CampaignBudget[]
    class?: string
  } = $props()
</script>

<Card class={className}>
  <h3 class="text-sm font-semibold text-ink">Performance and Budgets</h3>

  <div class="mt-3 flex items-center gap-2 text-sm text-gray-600">
    <BarChart3 size={16} />
    <span class="font-medium">Campaign Budgets</span>
  </div>

  <div class="mt-3 space-y-4">
    {#each budgets as budget}
      <div>
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="text-gray-600">{budget.label}</span>
            <span class="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
              {budget.recurrence ?? 'no recurrence'}
            </span>
          </div>
          <span class="font-mono text-gray-500">
            {formatNumber(budget.current)}/{formatNumber(budget.limit)}
          </span>
        </div>
        <div class="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
          <div
            class="h-1.5 rounded-full bg-primary"
            style="width: {Math.min((budget.current / budget.limit) * 100, 100)}%"
          ></div>
        </div>
      </div>
    {/each}
  </div>

  <div class="mt-4 space-y-1 text-sm text-gray-500">
    <p>View your campaign performance in the <button class="text-primary hover:underline">insights</button> section.</p>
    <p>View and create coupons in the <button class="text-primary hover:underline">coupons</button> section.</p>
  </div>

  <button class="mt-3 text-sm text-primary hover:underline">Go to Budgets</button>
</Card>
