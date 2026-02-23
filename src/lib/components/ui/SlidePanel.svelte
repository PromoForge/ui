<script lang="ts">
  import type { Snippet } from 'svelte'
  import Button from './Button.svelte'

  let {
    open = $bindable(false),
    title = '',
    submitLabel = 'Submit',
    onsubmit,
    loading = false,
    children
  }: {
    open?: boolean
    title?: string
    submitLabel?: string
    onsubmit?: () => void
    loading?: boolean
    children: Snippet
  } = $props()

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex justify-end"
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-label={title}
    tabindex="-1"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/40 transition-opacity"
      onclick={() => (open = false)}
      role="presentation"
    ></div>

    <!-- Panel -->
    <div class="relative flex w-full max-w-md flex-col bg-white shadow-xl">
      <!-- Header -->
      <div class="border-b border-border px-6 py-4">
        <h2 class="text-lg font-semibold text-ink">{title}</h2>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-6 py-6">
        {@render children()}
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
        <Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
        <Button variant="primary" onclick={onsubmit} disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </div>
  </div>
{/if}
