<script lang="ts">
  import { X, Calendar, Ticket } from 'lucide-svelte'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  let showBanner = $state(true)
  let showScheduleCard = $state(true)
  let showCouponsCard = $state(true)

  const hasCards = $derived(showScheduleCard || showCouponsCard)
</script>

{#if showBanner && hasCards}
  <div class="rounded-lg border border-blue-200 bg-blue-50/50 p-4 {className}">
    <div class="flex items-start justify-between">
      <h3 class="text-sm font-semibold text-foreground">
        Consider the following steps before activating your campaign
      </h3>
      <button
        class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        onclick={() => showBanner = false}
      >
        <X size={16} />
      </button>
    </div>

    <div class="mt-3 flex gap-3">
      {#if showScheduleCard}
        <div class="relative flex-1 rounded-lg border border-border bg-card p-4">
          <button
            class="absolute right-2 top-2 rounded-lg p-0.5 text-gray-400 hover:text-gray-600"
            onclick={() => showScheduleCard = false}
          >
            <X size={14} />
          </button>
          <div class="flex items-start gap-3">
            <Calendar size={20} class="mt-0.5 text-primary" />
            <div>
              <p class="text-sm font-semibold text-primary">Set a Schedule</p>
              <p class="mt-1 text-xs text-gray-500">Automate the start and end of your campaign.</p>
            </div>
          </div>
        </div>
      {/if}

      {#if showCouponsCard}
        <div class="relative flex-1 rounded-lg border border-border bg-card p-4">
          <button
            class="absolute right-2 top-2 rounded-lg p-0.5 text-gray-400 hover:text-gray-600"
            onclick={() => showCouponsCard = false}
          >
            <X size={14} />
          </button>
          <div class="flex items-start gap-3">
            <Ticket size={20} class="mt-0.5 text-primary" />
            <div>
              <p class="text-sm font-semibold text-primary">Create Coupons</p>
              <p class="mt-1 text-xs text-gray-500">Generate and modify your coupon codes.</p>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
