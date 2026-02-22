<script lang="ts">
  import { X } from 'lucide-svelte'
  import type { Snippet } from 'svelte'

  let {
    open = $bindable(false),
    title = '',
    children,
    class: className = ''
  }: {
    open?: boolean
    title?: string
    children: Snippet
    class?: string
  } = $props()

  function handleBackdropClick() {
    open = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center"
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-label={title}
    tabindex="-1"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/40"
      onclick={handleBackdropClick}
      role="presentation"
    ></div>

    <!-- Panel -->
    <div class="relative w-full max-w-md rounded-xl border border-border bg-panel p-6 shadow-lg {className}">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-ink">{title}</h2>
        <button
          class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          onclick={() => open = false}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Body -->
      <div class="mt-4">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
