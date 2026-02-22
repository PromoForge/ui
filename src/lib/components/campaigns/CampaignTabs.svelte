<script lang="ts">
  let {
    activeTab,
    onchange,
    class: className = ''
  }: {
    activeTab: 'current' | 'calendar' | 'archived'
    onchange: (tab: 'current' | 'calendar' | 'archived') => void
    class?: string
  } = $props()

  const tabs: Array<{ id: 'current' | 'calendar' | 'archived'; label: string }> = [
    { id: 'current', label: 'Current' },
    { id: 'calendar', label: 'Calendar View' },
    { id: 'archived', label: 'Archived' }
  ]
</script>

<div class="flex gap-0 border-b border-border {className}">
  {#each tabs as tab (tab.id)}
    <button
      class="relative px-4 py-2.5 text-sm font-medium transition-colors {
        activeTab === tab.id
          ? 'text-primary'
          : 'text-gray-500 hover:text-gray-700'
      }"
      onclick={() => onchange(tab.id)}
    >
      {tab.label}
      {#if activeTab === tab.id}
        <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
      {/if}
    </button>
  {/each}
</div>
