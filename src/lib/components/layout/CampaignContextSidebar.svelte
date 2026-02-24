<script lang="ts">
  import {
    LayoutDashboard,
    GitBranch,
    Ticket,
    BarChart3,
    Settings,
    ChevronLeft,
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
    campaignId,
    currentPath
  }: {
    applicationId: string
    applicationName: string
    environment: Environment
    campaignId: string
    currentPath: string
  } = $props()

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
</script>

<Sidebar.Root collapsible="none" class="border-r">
  <Sidebar.Header class="p-4">
    <!-- Back to Application -->
    <a
      href="/applications/{applicationId}/campaigns"
      class="flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
    >
      <ChevronLeft size={16} />
      To Application
    </a>

    <div class="mt-4">
      <AppSelectorDropdown {applicationId} {applicationName} {environment} />
    </div>

    <button
      class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      <Plus size={16} />
      Create Campaign
    </button>
  </Sidebar.Header>

  <Sidebar.Content>
    <!-- Manage Campaign -->
    <Sidebar.Group>
      <Sidebar.GroupLabel class="text-[10px] font-semibold uppercase tracking-wide">
        Manage Campaign
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each navItems as item}
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
