<script lang="ts">
  import { page } from '$app/state'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import * as Collapsible from '$lib/components/ui/collapsible/index.js'
  import {
    LayoutGrid,
    Building2,
    Puzzle,
    KeyRound,
    Wrench,
    ScrollText,
    ChevronRight
  } from 'lucide-svelte'

  const pathname = $derived(page.url.pathname)

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const toolsItems = [
    { label: 'Attributes', href: '/settings/tools/attributes' },
    { label: 'Additional Costs', href: '/settings/tools/additional-costs' },
    { label: 'Collections', href: '/settings/tools/collections' },
    { label: 'Cart Item Catalogs', href: '/settings/tools/cart-item-catalogs' },
    { label: 'Custom Effects', href: '/settings/tools/custom-effects' },
    { label: 'Webhooks', href: '/settings/tools/webhooks' },
    { label: 'Management API Keys', href: '/settings/tools/management-api-keys' },
    { label: 'API Tester', href: '/settings/tools/api-tester' }
  ]

  let toolsOpen = $state(true)
</script>

<Sidebar.Root collapsible="none" class="border-r">
  <Sidebar.Header class="px-4 pt-6 pb-2">
    <span class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
      Manage Account
    </span>
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <!-- Overview -->
          <Sidebar.MenuItem>
            <Sidebar.MenuButton isActive={isActive('/settings/overview')}>
              {#snippet child({ props }: { props: Record<string, unknown> })}
                <a href="/settings/overview" {...props}>
                  <LayoutGrid size={18} />
                  <span>Overview</span>
                </a>
              {/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>

          <!-- Organization -->
          <Sidebar.MenuItem>
            <Sidebar.MenuButton isActive={isActive('/settings/organization')}>
              {#snippet child({ props }: { props: Record<string, unknown> })}
                <a href="/settings/organization" {...props}>
                  <Building2 size={18} />
                  <span>Organization</span>
                </a>
              {/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>

          <!-- Integrations -->
          <Sidebar.MenuItem>
            <Sidebar.MenuButton isActive={isActive('/settings/integrations')}>
              {#snippet child({ props }: { props: Record<string, unknown> })}
                <a href="/settings/integrations" {...props}>
                  <Puzzle size={18} />
                  <span>Integrations</span>
                </a>
              {/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>

          <!-- Credentials -->
          <Sidebar.MenuItem>
            <Sidebar.MenuButton isActive={isActive('/settings/credentials')}>
              {#snippet child({ props }: { props: Record<string, unknown> })}
                <a href="/settings/credentials" {...props}>
                  <KeyRound size={18} />
                  <span>Credentials</span>
                </a>
              {/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>

          <!-- Tools (collapsible) -->
          <Collapsible.Root bind:open={toolsOpen} class="group/collapsible">
            <Sidebar.MenuItem>
              <Collapsible.Trigger>
                {#snippet child({ props })}
                  <Sidebar.MenuButton {...props}>
                    <Wrench size={18} />
                    <span>Tools</span>
                    <ChevronRight
                      size={16}
                      class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </Sidebar.MenuButton>
                {/snippet}
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {#each toolsItems as item (item.href)}
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton isActive={isActive(item.href)}>
                        {#snippet child({ props }: { props: Record<string, unknown> })}
                          <a href={item.href} {...props}>
                            {item.label}
                          </a>
                        {/snippet}
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                  {/each}
                </Sidebar.MenuSub>
              </Collapsible.Content>
            </Sidebar.MenuItem>
          </Collapsible.Root>

          <!-- Logs -->
          <Sidebar.MenuItem>
            <Sidebar.MenuButton isActive={isActive('/settings/logs')}>
              {#snippet child({ props }: { props: Record<string, unknown> })}
                <a href="/settings/logs" {...props}>
                  <ScrollText size={18} />
                  <span>Logs</span>
                </a>
              {/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
</Sidebar.Root>
