<script lang="ts">
  import type { Application } from '$lib/api/generated/types.gen'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Pencil } from 'lucide-svelte'

  let {
    application,
    selected = false,
    href,
    onclick,
    onedit
  }: {
    application: Application
    selected?: boolean
    href?: string
    onclick?: () => void
    onedit?: () => void
  } = $props()

  const isLive = $derived(application.environment === 'APPLICATION_ENVIRONMENT_LIVE')

  // Random but stable stats based on application id
  const stats = $derived.by(() => {
    const seed = application.id ?? 1
    const total = 200 + ((seed * 137) % 2000)
    const running = Math.floor(total * 0.1 + ((seed * 7) % Math.floor(total * 0.3)))
    const disabled = Math.floor(total * 0.4 + ((seed * 13) % Math.floor(total * 0.2)))
    const expired = total - running - disabled
    return { total, running, disabled, expired }
  })
</script>

<a
  {href}
  class="group block"
  onclick={onclick}
>
  <Card.Root
    class="gap-0 py-0 transition-all group-hover:shadow-md {selected
      ? 'border-l-2 border-l-primary bg-primary/[0.03]'
      : 'border-l-2 border-l-transparent'}"
  >
    <Card.Header class="p-4 pb-0">
      <Badge variant={isLive ? 'live' : 'sandbox'}>{isLive ? 'LIVE' : 'SANDBOX'}</Badge>
      <Card.Action>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-primary/60 hover:text-primary hover:bg-primary/10"
          onclick={(e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            onedit?.()
          }}
        >
          <Pencil class="h-3.5 w-3.5" />
        </Button>
      </Card.Action>
      <Card.Title class="text-base">{application.name}</Card.Title>
    </Card.Header>

    <Card.Content class="p-4 pt-2">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {stats.total.toLocaleString()} Campaigns
      </p>
      <div class="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
        <span class="flex items-center gap-1.5">
          <span class="inline-block h-2 w-2 rounded-full bg-success"></span>
          {stats.running.toLocaleString()} running
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block h-2 w-2 rounded-full bg-warning"></span>
          {stats.disabled.toLocaleString()} disabled
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block h-2 w-2 rounded-full bg-coral"></span>
          {stats.expired.toLocaleString()} expired
        </span>
      </div>
    </Card.Content>
  </Card.Root>
</a>
