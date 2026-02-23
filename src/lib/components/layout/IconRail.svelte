<script lang="ts">
  import {
    LayoutGrid,
    Heart,
    Gift,
    FileText,
    Users,
    Settings,
    User
  } from 'lucide-svelte'

  const navItems = [
    { label: 'Apps', icon: LayoutGrid, href: '/' },
    { label: 'Loyalty', icon: Heart, href: '#' },
    { label: 'Giveaways', icon: Gift, href: '#' },
    { label: 'Templates', icon: FileText, href: '#' },
    { label: 'Audiences', icon: Users, href: '#' }
  ]

  const bottomItems = [
    { label: 'Account', icon: Settings, href: '/settings' },
    { label: 'Profile', icon: User, href: '#' }
  ]

  let { currentPath = '/' }: { currentPath?: string } = $props()

  function isItemActive(itemHref: string): boolean {
    if (itemHref === '/') {
      return currentPath === '/' || currentPath.startsWith('/applications')
    }
    return currentPath === itemHref || currentPath.startsWith(itemHref + '/')
  }
</script>

<nav class="flex h-full w-14 flex-col items-center border-r border-border bg-card py-4">
  <!-- Logo mark -->
  <div class="mb-6 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
    PF
  </div>

  <!-- Main nav -->
  <div class="flex flex-col items-center gap-1">
    {#each navItems as item}
      <a
        href={item.href}
        class="group flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-colors {
          isItemActive(item.href)
            ? 'text-primary'
            : 'text-gray-500 hover:text-gray-700'
        }"
      >
        <item.icon size={20} />
        <span class="text-[10px] leading-tight">{item.label}</span>
      </a>
    {/each}
  </div>

  <!-- Spacer -->
  <div class="mt-auto"></div>

  <!-- Bottom nav -->
  <div class="flex flex-col items-center gap-1">
    {#each bottomItems as item}
      <a
        href={item.href}
        class="group flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-colors {
          isItemActive(item.href)
            ? 'text-primary'
            : 'text-gray-500 hover:text-gray-700'
        }"
      >
        <item.icon size={20} />
        <span class="text-[10px] leading-tight">{item.label}</span>
      </a>
    {/each}
  </div>
</nav>
