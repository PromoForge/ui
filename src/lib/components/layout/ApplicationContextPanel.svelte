<script lang="ts">
  import { goto } from '$app/navigation'
  import {
    LayoutDashboard,
    Megaphone,
    BarChart3,
    Bell,
    Store,
    Filter,
    Users,
    Activity,
    Zap,
    Search,
    Settings,
    ChevronDown,
    ChevronRight,
    Plus
  } from 'lucide-svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import type { Environment } from '$lib/types'

  let {
    applicationId,
    applicationName,
    environment,
    currentPath
  }: {
    applicationId: string
    applicationName: string
    environment: Environment
    currentPath: string
  } = $props()

  let showAppDropdown = $state(false)

  const manageItems = $derived([
    { label: 'Dashboard', icon: LayoutDashboard, href: `/applications/${applicationId}/dashboard` },
    { label: 'Campaigns', icon: Megaphone, href: `/applications/${applicationId}/campaigns` },
    { label: 'Campaign Evaluation', icon: BarChart3, href: `/applications/${applicationId}/campaign-evaluation` },
    { label: 'Notifications', icon: Bell, href: `/applications/${applicationId}/notifications` },
    { label: 'Stores', icon: Store, href: `/applications/${applicationId}/stores` },
    { label: 'Cart Item Filters', icon: Filter, href: `/applications/${applicationId}/cart-item-filters` }
  ])

  const activityItems = $derived([
    { label: 'Customers', icon: Users, href: `/applications/${applicationId}/customers` },
    { label: 'Sessions', icon: Activity, href: `/applications/${applicationId}/sessions` },
    { label: 'Events', icon: Zap, href: `/applications/${applicationId}/events` },
    { label: 'Coupon Finder', icon: Search, href: `/applications/${applicationId}/coupon-finder` },
    { label: 'Settings', icon: Settings, href: `/applications/${applicationId}/settings-app`, hasChevron: true }
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
  <!-- Application Selector -->
  <div>
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
            >{environment === 'APPLICATION_ENVIRONMENT_LIVE' ? 'LIVE' : 'SANDBOX'}</Badge>
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
              >{app.environment === 'APPLICATION_ENVIRONMENT_LIVE' ? 'LIVE' : 'SB'}</Badge>
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

  <!-- MANAGE APPLICATION -->
  <div class="mt-6">
    <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      Manage Application
    </span>
    <nav class="mt-2 flex flex-col gap-0.5">
      {#each manageItems as item}
        <a
          href={item.href}
          class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors {
            isActive(item.href)
              ? 'border-l-2 border-primary bg-blue-50 text-primary'
              : 'border-l-2 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }"
        >
          <item.icon size={16} />
          {item.label}
        </a>
      {/each}
    </nav>
  </div>

  <!-- ACTIVITY AND SUPPORT -->
  <div class="mt-6">
    <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      Activity and Support
    </span>
    <nav class="mt-2 flex flex-col gap-0.5">
      {#each activityItems as item}
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
