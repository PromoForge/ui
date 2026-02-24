<script lang="ts">
  import * as Select from '$lib/components/ui/select/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import type { Application } from '$lib/api/generated/types.gen'

  let {
    applications,
    selectedId,
    onSelect
  }: {
    applications: Application[]
    selectedId: string | null
    onSelect: (id: string) => void
  } = $props()

  const selectedApp = $derived(
    applications.find((a) => String(a.id) === selectedId) ?? null
  )

  function envLabel(env: string | undefined): string {
    return env === 'APPLICATION_ENVIRONMENT_LIVE' ? 'LIVE' : 'SB'
  }

  function envVariant(env: string | undefined): 'live' | 'sandbox' {
    return env === 'APPLICATION_ENVIRONMENT_LIVE' ? 'live' : 'sandbox'
  }
</script>

<div>
  <span class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
    Application
  </span>
  <div class="mt-1">
    <Select.Root
      type="single"
      value={selectedId ?? undefined}
      onValueChange={(v) => { if (v) onSelect(v) }}
    >
      <Select.Trigger class="w-64">
        {#if selectedApp}
          <span class="flex items-center gap-2">
            <Badge variant={envVariant(selectedApp.environment)}>
              {envLabel(selectedApp.environment)}
            </Badge>
            {selectedApp.name}
          </span>
        {:else}
          <span class="text-muted-foreground">Select application</span>
        {/if}
      </Select.Trigger>
      <Select.Content>
        {#each applications as app (app.id)}
          <Select.Item value={String(app.id)}>
            <span class="flex items-center gap-2">
              <Badge variant={envVariant(app.environment)}>
                {envLabel(app.environment)}
              </Badge>
              {app.name}
            </span>
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
</div>
