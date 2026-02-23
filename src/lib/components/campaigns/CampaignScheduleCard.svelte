<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js'
  import { formatDate } from '$lib/utils'

  let {
    schedule,
    class: className = ''
  }: {
    schedule: { startDate: string | null; endDate: string | null }
    class?: string
  } = $props()

  const hasSchedule = $derived(schedule.startDate !== null || schedule.endDate !== null)
</script>

<Card.Root class={className}>
  <Card.Content>
  <h3 class="text-sm font-semibold text-ink">Schedule</h3>

  {#if hasSchedule}
    <div class="mt-3 space-y-1 text-sm text-gray-600">
      {#if schedule.startDate}
        <p>Start: {formatDate(schedule.startDate)}</p>
      {/if}
      {#if schedule.endDate}
        <p>End: {formatDate(schedule.endDate)}</p>
      {/if}
    </div>
  {:else}
    <p class="mt-3 text-sm font-medium text-gray-600">No time limit</p>
    <p class="mt-1 text-sm text-gray-500">The campaign has no schedule. If running, it will run with no time limit.</p>
  {/if}

  <button class="mt-3 text-sm text-primary hover:underline">Go to Schedule</button>
  </Card.Content>
</Card.Root>
