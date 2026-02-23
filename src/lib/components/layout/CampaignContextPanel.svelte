<script lang="ts">
  import { goto } from '$app/navigation'
  import {
    LayoutDashboard,
    GitBranch,
    Ticket,
    BarChart3,
    Settings,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Plus
  } from 'lucide-svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { campaignDetailStore } from '$lib/stores/campaignDetailStore.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import type { Environment } from '$lib/types'

  let {
    applicationId,
    applicationName,
    environment,
    campaignId,
    currentPath
  }: {
    applicationId: string
    applicationName: string
    environment: Environment
    campaignId: string
    currentPath: string
  } = $props()

  let showAppDropdown = $state(false)

  const basePath = $derived(`/applications/${applicationId}/campaigns/${campaignId}`)

  const navItems = $derived([
    { label: 'Dashboard', icon: LayoutDashboard, href: `${basePath}/dashboard` },
    { label: 'Rule Builder', icon: GitBranch, href: `${basePath}/rule-builder` },
    { label: 'Coupons', icon: Ticket, href: `${basePath}/coupons` },
    { label: 'Insights', icon: BarChart3, href: `${basePath}/insights` },
    { label: 'Settings', icon: Settings, href: `${basePath}/settings`, hasChevron: true }
  ])

  function isActive(href: string): boolean {
    return currentPath === href || currentPath.startsWith(href + '/')
  }

  function selectApp(id: string) {
    showAppDropdown = false
    goto(`/applications/${id}`)
  }

  function handleWindowClick() {
    showAppDropdown = false
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="flex h-full flex-col p-4">
  <!-- Back to Application -->
  <a
    href="/applications/{applicationId}/campaigns"
    class="flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
  >
    <ChevronLeft size={16} />
    To Application
  </a>

  <!-- Application Selector -->
  <div class="mt-4">
    <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      Select Application
    </span>
    <div class="relative mt-1">
      <button
        class="flex w-full items-center justify-between rounded-lg border border-border bg-panel px-3 py-2 text-left text-sm"
        onclick={(e: MouseEvent) => { e.stopPropagation(); showAppDropdown = !showAppDropdown }}
      >
        <div>
          <div class="font-semibold text-ink">{applicationName}</div>
          <div class="mt-0.5">
            <Badge
              variant={environment === 'APPLICATION_ENVIRONMENT_LIVE' ? 'live' : 'sandbox'}
              label={environment === 'APPLICATION_ENVIRONMENT_LIVE' ? 'LIVE' : 'SANDBOX'}
            />
          </div>
        </div>
        <ChevronDown size={16} class="text-gray-400" />
      </button>

      {#if showAppDropdown}
        <div
          class="absolute z-10 mt-1 w-full rounded-lg border border-border bg-panel py-1 shadow-card"
          role="menu"
          tabindex="-1"
          onclick={(e: MouseEvent) => e.stopPropagation()}
          onkeydown={(e: KeyboardEvent) => { if (e.key === 'Escape') showAppDropdown = false }}
        >
          {#each applicationStore.applications as app (app.id)}
            <button
              class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 {
                applicationId === String(app.id) ? 'bg-blue-50 text-primary' : 'text-ink'
              }"
              onclick={() => selectApp(String(app.id))}
            >
              <Badge
                variant={app.environment === 'APPLICATION_ENVIRONMENT_LIVE' ? 'live' : 'sandbox'}
                label={app.environment === 'APPLICATION_ENVIRONMENT_LIVE' ? 'LIVE' : 'SB'}
              />
              {app.name}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Create Campaign CTA -->
  <button
    class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
  >
    <Plus size={16} />
    Create Campaign
  </button>

  <!-- MANAGE CAMPAIGN -->
  <div class="mt-6">
    <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      Manage Campaign
    </span>
    <nav class="mt-2 flex flex-col gap-0.5">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors {
            isActive(item.href)
              ? 'border-l-2 border-primary bg-blue-50 text-primary'
              : 'border-l-2 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }"
        >
          <div class="flex items-center gap-2.5">
            <item.icon size={16} />
            {item.label}
          </div>
          {#if item.hasChevron}
            <ChevronRight size={14} class="text-gray-400" />
          {/if}
        </a>
      {/each}
    </nav>
  </div>
</div>
