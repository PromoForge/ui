<script lang="ts">
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
    ChevronRight,
    Plus
  } from 'lucide-svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import AppSelectorDropdown from './AppSelectorDropdown.svelte'
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
</script>

<Sidebar.Root collapsible="none" class="border-r">
  <Sidebar.Header class="p-4">
    <AppSelectorDropdown {applicationId} {applicationName} {environment} />
    <button
      class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      <Plus size={16} />
      Create Campaign
    </button>
  </Sidebar.Header>

  <Sidebar.Content>
    <!-- Manage Application -->
    <Sidebar.Group>
      <Sidebar.GroupLabel class="text-[10px] font-semibold uppercase tracking-wide">
        Manage Application
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each manageItems as item}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={isActive(item.href)}>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <a href={item.href} {...props}>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>

    <!-- Activity and Support -->
    <Sidebar.Group>
      <Sidebar.GroupLabel class="text-[10px] font-semibold uppercase tracking-wide">
        Activity and Support
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each activityItems as item}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={isActive(item.href)}>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <a href={item.href} {...props} class="{props.class} justify-between">
                    <span class="flex items-center gap-2">
                      <item.icon />
                      <span>{item.label}</span>
                    </span>
                    {#if item.hasChevron}
                      <ChevronRight class="size-3.5 text-sidebar-foreground/40" />
                    {/if}
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
</Sidebar.Root>
