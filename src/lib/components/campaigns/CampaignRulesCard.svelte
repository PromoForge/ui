<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js'
  import type { CampaignRule } from '$lib/types'

  let {
    rules,
    class: className = ''
  }: {
    rules: CampaignRule[]
    class?: string
  } = $props()
</script>

<Card.Root class={className}>
  <Card.Content>
  <h3 class="text-sm font-semibold text-ink">Rules</h3>

  {#if rules.length > 0}
    <p class="mt-2 text-sm text-gray-500">The campaign contains the following rules:</p>

    <div class="mt-3 space-y-3">
      {#each rules as rule}
        <div>
          <p class="text-sm font-medium text-ink">{rule.name}</p>
          <p class="text-xs text-gray-400">
            Defined by {rule.conditions} condition{rule.conditions !== 1 ? 's' : ''} and {rule.effects} effect{rule.effects !== 1 ? 's' : ''}
          </p>
        </div>
      {/each}
    </div>
  {:else}
    <p class="mt-2 text-sm text-gray-500">No rules defined yet.</p>
  {/if}

  <button class="mt-4 text-sm text-primary hover:underline">Go to the Rule Builder</button>
  </Card.Content>
</Card.Root>
