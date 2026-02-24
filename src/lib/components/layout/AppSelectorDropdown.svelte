<script lang="ts">
  import { goto } from '$app/navigation'
  import { ChevronDown } from 'lucide-svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import type { Environment } from '$lib/types'

  let {
    applicationId,
    applicationName,
    environment
  }: {
    applicationId: string
    applicationName: string
    environment: Environment
  } = $props()

  let showAppDropdown = $state(false)

  function selectApp(id: string) {
    showAppDropdown = false
    goto(`/applications/${id}`)
  }

  function handleWindowClick() {
    showAppDropdown = false
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div>
  <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
    Select Application
  </span>
  <div class="relative mt-1">
    <button
      class="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left text-sm"
      onclick={(e: MouseEvent) => { e.stopPropagation(); showAppDropdown = !showAppDropdown }}
    >
      <div>
        <div class="font-semibold text-foreground">{applicationName}</div>
        <div class="mt-0.5">
          <Badge
            variant={environment === 'APPLICATION_ENVIRONMENT_LIVE' ? 'live' : 'sandbox'}
          >{environment === 'APPLICATION_ENVIRONMENT_LIVE' ? 'LIVE' : 'SANDBOX'}</Badge>
        </div>
      </div>
      <ChevronDown size={16} class="text-gray-400" />
    </button>

    {#if showAppDropdown}
      <div
        class="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card py-1 shadow-card"
        role="menu"
        tabindex="-1"
        onclick={(e: MouseEvent) => e.stopPropagation()}
        onkeydown={(e: KeyboardEvent) => { if (e.key === 'Escape') showAppDropdown = false }}
      >
        {#each applicationStore.applications as app (app.id)}
          <button
            class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 {
              applicationId === String(app.id) ? 'bg-blue-50 text-primary' : 'text-foreground'
            }"
            onclick={() => selectApp(String(app.id))}
          >
            <Badge
              variant={app.environment === 'APPLICATION_ENVIRONMENT_LIVE' ? 'live' : 'sandbox'}
            >{app.environment === 'APPLICATION_ENVIRONMENT_LIVE' ? 'LIVE' : 'SB'}</Badge>
            {app.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
