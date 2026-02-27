<script lang="ts">
  import type {
    Application,
    Webhook,
    WebhookHeader,
    WebhookParameter,
    CreateWebhookRequest,
    UpdateWebhookRequest,
    TestWebhookResponse,
  } from '$lib/api/generated/types.gen'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { CircleHelp, Trash2, Copy } from 'lucide-svelte'
  import WebhookHeadersInput from './WebhookHeadersInput.svelte'
  import WebhookParametersInput from './WebhookParametersInput.svelte'
  import WebhookPayloadEditor from './WebhookPayloadEditor.svelte'
  import WebhookPreview from './WebhookPreview.svelte'
  import WebhookTestSection from './WebhookTestSection.svelte'

  let {
    mode = 'create',
    webhook = undefined,
    open = false,
    onOpenChange,
    onSubmit,
    onUpdate,
    onDelete,
    onCopy,
    onTest,
    applications = [],
  }: {
    mode?: 'create' | 'edit'
    webhook?: Webhook
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit?: (request: CreateWebhookRequest) => Promise<Webhook>
    onUpdate?: (request: Omit<UpdateWebhookRequest, 'webhookId'>) => Promise<void>
    onDelete?: (webhookId: string) => Promise<void>
    onCopy?: (webhookId: string) => Promise<void>
    onTest?: (webhookId: string) => Promise<TestWebhookResponse>
    applications: Application[]
  } = $props()

  const VERBS = [
    { value: 'WEBHOOK_VERB_DELETE', label: 'DELETE' },
    { value: 'WEBHOOK_VERB_GET', label: 'GET' },
    { value: 'WEBHOOK_VERB_PATCH', label: 'PATCH' },
    { value: 'WEBHOOK_VERB_POST', label: 'POST' },
    { value: 'WEBHOOK_VERB_PUT', label: 'PUT' },
  ] as const

  // Form state
  let name = $state('')
  let description = $state('')
  let verb = $state<string>('WEBHOOK_VERB_POST')
  let url = $state('')
  let userHeaders = $state<WebhookHeader[]>([])
  let parameters = $state<WebhookParameter[]>([])
  let payload = $state('')
  let selectedAppIds = $state<number[]>([])
  let appDropdownOpen = $state(false)

  // UI state
  let submitting = $state(false)
  let attempted = $state(false)
  let submitError = $state('')
  let createdWebhookId = $state<string | undefined>(undefined)

  // Delete dialog state
  let deleteDialogOpen = $state(false)
  let deleting = $state(false)
  let deleteError = $state('')

  // Validation
  const nameError = $derived(attempted && !name.trim() ? 'Name is required' : '')
  const urlError = $derived(attempted && !url.trim() ? 'URL is required' : '')

  // The effective webhookId — either from edit mode or after creation
  const effectiveWebhookId = $derived(webhook?.id ?? createdWebhookId)

  function getVerbLabel(v: string): string {
    return VERBS.find((vb) => vb.value === v)?.label ?? 'POST'
  }

  // Pre-populate form in edit mode
  $effect(() => {
    if (mode === 'edit' && webhook && open) {
      name = webhook.name ?? ''
      description = webhook.description ?? ''
      verb = webhook.verb ?? 'WEBHOOK_VERB_POST'
      url = webhook.url ?? ''
      // Separate default headers from user headers
      userHeaders = (webhook.headers ?? []).filter(
        (h) => h.key !== 'X-UUID' && h.key !== 'Content-Type',
      )
      parameters = webhook.parameters ? [...webhook.parameters] : []
      payload = webhook.payload ?? ''
      selectedAppIds = webhook.connectedApplicationIds
        ? [...webhook.connectedApplicationIds]
        : []
    }
  })

  function toggleApp(appId: number) {
    if (selectedAppIds.includes(appId)) {
      selectedAppIds = selectedAppIds.filter((id) => id !== appId)
    } else {
      selectedAppIds = [...selectedAppIds, appId]
    }
  }

  function resetForm() {
    name = ''
    description = ''
    verb = 'WEBHOOK_VERB_POST'
    url = ''
    userHeaders = []
    parameters = []
    payload = ''
    selectedAppIds = []
    appDropdownOpen = false
    submitting = false
    attempted = false
    submitError = ''
    createdWebhookId = undefined
  }

  function handleCancel() {
    resetForm()
    onOpenChange(false)
  }

  function buildRequest(): CreateWebhookRequest {
    return {
      name: name.trim(),
      description: description.trim() || undefined,
      verb: verb as CreateWebhookRequest['verb'],
      url: url.trim(),
      headers: userHeaders.filter((h) => h.key?.trim()),
      parameters: parameters.filter((p) => p.name?.trim()),
      payload: payload.trim() || undefined,
      applicationIds: selectedAppIds.length > 0 ? selectedAppIds : undefined,
    }
  }

  async function handleSubmit() {
    attempted = true
    submitError = ''
    if (!name.trim() || !url.trim()) return

    submitting = true
    try {
      if (mode === 'create') {
        const created = await onSubmit?.(buildRequest())
        if (created?.id) {
          createdWebhookId = created.id
        }
      } else {
        await onUpdate?.(buildRequest())
      }
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError =
        e instanceof Error
          ? e.message
          : mode === 'create'
            ? 'Failed to create webhook'
            : 'Failed to update webhook'
    } finally {
      submitting = false
    }
  }

  async function handleSaveDraft() {
    attempted = true
    submitError = ''
    if (!name.trim() || !url.trim()) return

    submitting = true
    try {
      const req = buildRequest()
      if (mode === 'create') {
        await onSubmit?.(req)
      } else {
        await onUpdate?.({ ...req, enabled: false })
      }
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError = e instanceof Error ? e.message : 'Failed to save draft'
    } finally {
      submitting = false
    }
  }

  async function handleDelete() {
    if (!webhook?.id) return
    deleting = true
    deleteError = ''
    try {
      await onDelete?.(webhook.id)
      deleteDialogOpen = false
      resetForm()
      onOpenChange(false)
    } catch (e) {
      deleteError = e instanceof Error ? e.message : 'Failed to delete webhook'
    } finally {
      deleting = false
    }
  }

  function handleSheetOpenChange(isOpen: boolean) {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }
</script>

<Sheet.Root {open} onOpenChange={handleSheetOpenChange}>
  <Sheet.Content side="right" class="w-[80vw] sm:max-w-[80vw] flex flex-col">
    <Sheet.Header>
      <Sheet.Title class="sr-only">
        {mode === 'edit' ? 'Edit Webhook' : 'Create Webhook'}
      </Sheet.Title>
    </Sheet.Header>

    <div class="flex-1 overflow-hidden flex">
      <!-- Left column: Form (scrollable) -->
      <div class="flex-[55] overflow-y-auto px-6 py-4 space-y-5 border-r">
        {#if submitError}
          <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </div>
        {/if}

        {#if mode === 'create'}
          <p class="text-sm text-muted-foreground">
            Create a webhook to send information in real time to third-party software.
            Enter the basic properties and request details of the webhook below.
          </p>
        {:else}
          <p class="text-sm text-muted-foreground">
            Edit the request details and payload of the webhook.
          </p>
        {/if}

        <!-- Name -->
        <div class="space-y-1.5">
          <Label class="text-sm font-medium">Name</Label>
          <Input
            value={name}
            oninput={(e: Event) => { name = (e.target as HTMLInputElement).value }}
            class={nameError ? 'border-destructive ring-destructive' : ''}
          />
          {#if nameError}
            <p class="text-xs text-destructive font-medium">{nameError}</p>
          {/if}
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <Label class="text-sm font-medium">Description (optional)</Label>
          <textarea
            class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
            value={description}
            oninput={(e: Event) => { description = (e.target as HTMLTextAreaElement).value }}
          ></textarea>
        </div>

        <!-- Connected Applications -->
        <div class="space-y-2">
          <h3 class="text-base font-medium">Connected Applications</h3>
          <p class="text-sm text-muted-foreground">
            Select the Applications where you want to use the webhook.
            Select none to make the webhook available for use in all Applications.
          </p>
          <Popover.Root bind:open={appDropdownOpen}>
            <Popover.Trigger
              class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <span class={selectedAppIds.length === 0 ? 'text-muted-foreground' : ''}>
                {selectedAppIds.length === 0
                  ? 'All Applications'
                  : `${selectedAppIds.length} selected`}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" class="text-muted-foreground">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </Popover.Trigger>
            <Popover.Content class="w-[--bits-popover-trigger-width] p-0" align="start">
              <div class="max-h-48 overflow-y-auto py-1">
                {#each applications as app (app.id)}
                  {@const isSelected = selectedAppIds.includes(app.id ?? 0)}
                  <button
                    class="flex w-full items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors
                      {isSelected ? 'bg-accent' : 'hover:bg-accent/50'}"
                    onclick={() => toggleApp(app.id ?? 0)}
                  >
                    <Checkbox
                      checked={isSelected}
                      class="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span class="font-medium">{app.name ?? 'Unnamed'}</span>
                  </button>
                {/each}
                {#if applications.length === 0}
                  <p class="px-3 py-2 text-sm text-muted-foreground">No applications found.</p>
                {/if}
              </div>
            </Popover.Content>
          </Popover.Root>
        </div>

        <Separator />

        <!-- Request Details -->
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-medium">Request details</h3>
            <p class="text-sm text-muted-foreground mt-1">Specify the destination of the webhook.</p>
          </div>

          <!-- Verb -->
          <div class="space-y-1.5">
            <Label class="text-sm font-medium">Verb</Label>
            <Select.Root
              type="single"
              value={verb}
              onValueChange={(val) => { if (val) verb = val }}
            >
              <Select.Trigger class="w-full">
                {getVerbLabel(verb)}
              </Select.Trigger>
              <Select.Content>
                {#each VERBS as v (v.value)}
                  <Select.Item value={v.value}>{v.label}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>

          <!-- URL -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5">
              <Label class="text-sm font-medium">URL</Label>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  <CircleHelp size={14} class="text-muted-foreground" />
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p>The URL receiving the webhook. You can reference attributes here,
                    like ${'${$Application.Attributes.url}'}.</p>
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
            <Input
              value={url}
              placeholder="https://example.com/webhook"
              oninput={(e: Event) => { url = (e.target as HTMLInputElement).value }}
              class={urlError ? 'border-destructive ring-destructive' : ''}
            />
            {#if urlError}
              <p class="text-xs text-destructive font-medium">{urlError}</p>
            {/if}
          </div>
        </div>

        <Separator />

        <!-- Headers -->
        <WebhookHeadersInput bind:headers={userHeaders} />

        <Separator />

        <!-- Parameters -->
        <WebhookParametersInput bind:parameters />

        <!-- Edit-only sections -->
        {#if mode === 'edit'}
          <Separator />

          <!-- Copy -->
          <div class="space-y-2">
            <h3 class="text-base font-medium">Copy (optional)</h3>
            <p class="text-sm text-muted-foreground">
              Copy all the parameters and request details of this webhook to a new webhook.
            </p>
            <Button
              variant="outline"
              onclick={() => { if (webhook?.id) onCopy?.(webhook.id) }}
            >
              <Copy size={14} class="mr-1.5" />
              Copy Webhook
            </Button>
          </div>

          <Separator />

          <!-- Delete -->
          <div class="space-y-2 pt-2">
            <h3 class="text-base font-medium text-destructive">Delete webhook</h3>
            <p class="text-sm text-muted-foreground">
              Permanently delete all information related to the webhook.
            </p>
            <Button
              variant="outline"
              class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              onclick={() => (deleteDialogOpen = true)}
            >
              <Trash2 size={14} class="mr-1.5" />
              Delete Webhook
            </Button>
          </div>
        {/if}
      </div>

      <!-- Right column: Payload / Preview / Test (scrollable) -->
      <div class="flex-[45] overflow-y-auto px-6 py-4 space-y-6">
        <WebhookPayloadEditor bind:value={payload} />

        <Separator />

        <WebhookPreview
          verb={verb}
          url={url}
          headers={userHeaders}
          payload={payload}
        />

        <Separator />

        <WebhookTestSection
          webhookId={effectiveWebhookId}
          {onTest}
        />
      </div>
    </div>

    <Sheet.Footer class="border-t px-6 py-4 flex justify-end gap-2">
      <Button variant="ghost" onclick={handleCancel} disabled={submitting}>
        Cancel
      </Button>
      <Button variant="outline" onclick={handleSaveDraft} disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Draft'}
      </Button>
      <Button onclick={handleSubmit} disabled={submitting}>
        {#if submitting}
          {mode === 'edit' ? 'Saving...' : 'Creating...'}
        {:else}
          {mode === 'edit' ? 'Save' : 'Create Webhook'}
        {/if}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>

<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete Webhook</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete {webhook?.name ?? 'this webhook'}?
        This action is permanent.
      </Dialog.Description>
    </Dialog.Header>
    {#if deleteError}
      <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {deleteError}
      </div>
    {/if}
    <Dialog.Footer>
      <Button variant="ghost" onclick={() => (deleteDialogOpen = false)} disabled={deleting}>
        Cancel
      </Button>
      <Button
        variant="outline"
        class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
        onclick={handleDelete}
        disabled={deleting}
      >
        {#if deleting}
          Deleting...
        {:else}
          <Trash2 size={14} class="mr-1.5" />
          Delete Webhook
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
