<script lang="ts">
  import { onMount } from 'svelte'
  import { webhookStore } from '$lib/stores/webhookStore.svelte'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Plus, ChevronLeft, ChevronRight, Search } from 'lucide-svelte'
  import WebhookTable from '$lib/components/webhooks/WebhookTable.svelte'
  import WebhookSheet from '$lib/components/webhooks/WebhookSheet.svelte'

  onMount(() => {
    webhookStore.loadWebhooks()
    applicationStore.loadApplications()
  })

  const startItem = $derived(
    (webhookStore.currentPage - 1) * webhookStore.pageSize + 1,
  )
  const endItem = $derived(
    Math.min(
      webhookStore.currentPage * webhookStore.pageSize,
      webhookStore.totalFiltered,
    ),
  )
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="flex items-center justify-between px-8 pt-8 pb-2">
    <h1 class="text-2xl font-semibold">Webhooks</h1>
    <Button onclick={() => (webhookStore.createSheetOpen = true)}>
      <Plus size={16} class="mr-1.5" />
      Create Webhook
    </Button>
  </div>

  <!-- Search + Pagination -->
  <div class="px-8 pt-4 space-y-2">
    <div class="flex items-center justify-between">
      <div class="relative w-80">
        <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Webhook or integration name"
          class="pl-9"
          value={webhookStore.searchQuery}
          oninput={(e: Event) =>
            webhookStore.setSearchQuery((e.target as HTMLInputElement).value)}
        />
      </div>
    </div>

    {#if webhookStore.totalFiltered > 0}
      <div class="flex items-center justify-end gap-2">
        <span class="text-sm text-muted-foreground">
          {startItem} – {endItem} of {webhookStore.totalFiltered}
        </span>
        <button
          class="p-1 rounded hover:bg-muted disabled:opacity-30"
          disabled={webhookStore.currentPage <= 1}
          onclick={() => webhookStore.setPage(webhookStore.currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          class="p-1 rounded hover:bg-muted disabled:opacity-30"
          disabled={webhookStore.currentPage >= webhookStore.totalPages}
          onclick={() => webhookStore.setPage(webhookStore.currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    {/if}
  </div>

  <!-- Table -->
  <div class="flex-1 overflow-y-auto px-8 pt-4">
    {#if webhookStore.loading}
      <div class="flex items-center justify-center py-16">
        <p class="text-muted-foreground">Loading webhooks...</p>
      </div>
    {:else if webhookStore.error}
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <p class="text-destructive">{webhookStore.error}</p>
          <Button variant="outline" class="mt-4" onclick={() => webhookStore.loadWebhooks()}>
            Retry
          </Button>
        </div>
      </div>
    {:else}
      <WebhookTable
        webhooks={webhookStore.paginatedWebhooks}
        applications={applicationStore.applications}
        onEdit={(webhook) => webhookStore.openEditSheet(webhook)}
        onCopy={async (webhook) => {
          if (webhook.id) await webhookStore.duplicateWebhook(webhook.id)
        }}
      />
    {/if}
  </div>

  <!-- Create Sheet -->
  <WebhookSheet
    mode="create"
    open={webhookStore.createSheetOpen}
    onOpenChange={(v) => (webhookStore.createSheetOpen = v)}
    onSubmit={async (req) => webhookStore.addWebhook(req)}
    onTest={(id) => webhookStore.testWebhookById(id)}
    applications={applicationStore.applications}
  />

  <!-- Edit Sheet -->
  <WebhookSheet
    mode="edit"
    webhook={webhookStore.editingWebhook ?? undefined}
    open={webhookStore.editSheetOpen}
    onOpenChange={(v) => {
      if (!v) webhookStore.closeEditSheet()
    }}
    onUpdate={async (req) => {
      if (webhookStore.editingWebhook?.id) {
        await webhookStore.modifyWebhook(webhookStore.editingWebhook.id, req)
      }
    }}
    onDelete={async (id) => {
      await webhookStore.removeWebhook(id)
    }}
    onCopy={async (id) => {
      await webhookStore.duplicateWebhook(id)
    }}
    onTest={(id) => webhookStore.testWebhookById(id)}
    applications={applicationStore.applications}
  />
</div>
