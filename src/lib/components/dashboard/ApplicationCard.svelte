<script lang="ts">
  import type { Application } from '$lib/api/generated/types.gen'
  import { Badge } from '$lib/components/ui/badge/index.js'

  let {
    application,
    selected = false,
    href,
    onclick
  }: {
    application: Application
    selected?: boolean
    href?: string
    onclick?: () => void
  } = $props()

  const isLive = $derived(application.environment === 'APPLICATION_ENVIRONMENT_LIVE')
</script>

<a
  {href}
  class="group block w-full cursor-pointer rounded-lg bg-card p-4 text-left shadow-card transition-all hover:shadow-md {selected
    ? 'border-l-2 border-primary bg-blue-50/50'
    : 'border-l-2 border-transparent'}"
  onclick={onclick}
>
  <!-- Top row: badge -->
  <div class="flex items-start justify-between">
    <Badge variant={isLive ? 'live' : 'sandbox'}>{isLive ? 'LIVE' : 'SANDBOX'}</Badge>
  </div>

  <!-- App name -->
  <h3 class="mt-2 text-base font-bold text-foreground">{application.name}</h3>

  <!-- Description -->
  {#if application.description}
    <p class="mt-1 text-xs text-gray-500 line-clamp-2">{application.description}</p>
  {/if}
</a>
