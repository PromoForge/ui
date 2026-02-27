<script lang="ts">
  import type {
    Application,
    AdditionalCost,
    CreateAdditionalCostRequest,
    UpdateAdditionalCostRequest,
  } from '$lib/api/generated/types.gen'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { CircleHelp, Trash2 } from 'lucide-svelte'

  let {
    mode = 'create',
    cost = undefined,
    open = false,
    onOpenChange,
    onSubmit,
    onUpdate,
    onDelete,
    applications = [],
  }: {
    mode?: 'create' | 'edit'
    cost?: AdditionalCost
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit?: (request: CreateAdditionalCostRequest) => Promise<void>
    onUpdate?: (request: Omit<UpdateAdditionalCostRequest, 'additionalCostId'>) => Promise<void>
    onDelete?: (additionalCostId: number) => Promise<void>
    applications: Application[]
  } = $props()

  // Form state
  let scopeSession = $state(true)
  let scopeItem = $state(false)
  let apiName = $state('')
  let title = $state('')
  let description = $state('')
  let selectedAppIds = $state<number[]>([])
  let appDropdownOpen = $state(false)
  let submitting = $state(false)
  let attempted = $state(false)
  let apiNameManuallyEdited = $state(false)
  let submitError = $state('')

  // Delete dialog state
  let deleteDialogOpen = $state(false)
  let deleting = $state(false)
  let deleteError = $state('')

  // Derive the cost type from checkboxes
  function getCostType(): CreateAdditionalCostRequest['type'] {
    if (scopeSession && scopeItem) return 'ADDITIONAL_COST_TYPE_BOTH'
    if (scopeItem) return 'ADDITIONAL_COST_TYPE_ITEM'
    return 'ADDITIONAL_COST_TYPE_SESSION'
  }

  // Validation
  const scopeError = $derived(attempted && !scopeSession && !scopeItem ? 'Select at least one scope' : '')
  const apiNameError = $derived(
    attempted && !apiName
      ? 'Required'
      : apiName && !/^[a-zA-Z0-9_]+$/.test(apiName)
        ? 'Only letters, numbers, and underscores'
        : '',
  )

  // Auto-slug generation from title
  $effect(() => {
    if (!apiNameManuallyEdited && title) {
      apiName = title
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
    }
  })

  // Pre-populate form in edit mode
  $effect(() => {
    if (mode === 'edit' && cost && open) {
      const costType = cost.type ?? 'ADDITIONAL_COST_TYPE_SESSION'
      scopeSession =
        costType === 'ADDITIONAL_COST_TYPE_SESSION' ||
        costType === 'ADDITIONAL_COST_TYPE_BOTH'
      scopeItem =
        costType === 'ADDITIONAL_COST_TYPE_ITEM' ||
        costType === 'ADDITIONAL_COST_TYPE_BOTH'
      apiName = cost.name ?? ''
      title = cost.title ?? ''
      description = cost.description ?? ''
      selectedAppIds = cost.subscribedApplicationsIds
        ? [...cost.subscribedApplicationsIds]
        : []
      apiNameManuallyEdited = true
    }
  })

  function toggleApp(appId: number) {
    if (selectedAppIds.includes(appId)) {
      selectedAppIds = selectedAppIds.filter((id) => id !== appId)
    } else {
      selectedAppIds = [...selectedAppIds, appId]
    }
  }

  function removeApp(appId: number) {
    selectedAppIds = selectedAppIds.filter((id) => id !== appId)
  }

  function resetForm() {
    scopeSession = true
    scopeItem = false
    apiName = ''
    title = ''
    description = ''
    selectedAppIds = []
    appDropdownOpen = false
    submitting = false
    attempted = false
    apiNameManuallyEdited = false
    submitError = ''
  }

  function handleCancel() {
    resetForm()
    onOpenChange(false)
  }

  async function handleSubmit() {
    attempted = true
    submitError = ''

    if (!scopeSession && !scopeItem) return
    if (!apiName || !/^[a-zA-Z0-9_]+$/.test(apiName)) return

    submitting = true
    try {
      const subscribedApplicationsIds =
        selectedAppIds.length > 0 ? selectedAppIds : undefined

      if (mode === 'create') {
        const request: CreateAdditionalCostRequest = {
          name: apiName,
          title: title || undefined,
          description: description || undefined,
          type: getCostType(),
          subscribedApplicationsIds,
        }
        await onSubmit?.(request)
      } else {
        const request: Omit<UpdateAdditionalCostRequest, 'additionalCostId'> = {
          title: title || undefined,
          description: description || undefined,
          type: getCostType(),
          subscribedApplicationsIds,
        }
        await onUpdate?.(request)
      }
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError =
        e instanceof Error
          ? e.message
          : mode === 'create'
            ? 'Failed to create additional cost'
            : 'Failed to update additional cost'
    } finally {
      submitting = false
    }
  }

  async function handleDelete() {
    if (!cost?.id) return
    deleting = true
    deleteError = ''
    try {
      await onDelete?.(cost.id)
      deleteDialogOpen = false
      resetForm()
      onOpenChange(false)
    } catch (e) {
      deleteError =
        e instanceof Error ? e.message : 'Failed to delete additional cost'
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
  <Sheet.Content side="right" class="w-[480px] sm:max-w-[480px] flex flex-col">
    <Sheet.Header>
      <Sheet.Title>
        {mode === 'edit' ? 'Edit Additional Cost' : 'Create Additional Cost'}
      </Sheet.Title>
      <Sheet.Description class="text-sm text-foreground">
        An additional cost represents an added fee, such as a shipping fee. A cost has a scope
        describing whether the cost applies to the cart (session) or a given item.
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
      {#if submitError}
        <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      {/if}

      <!-- Scope -->
      <div class="space-y-2">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Scope</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Whether this cost applies to the cart session, individual items, or both.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <div class="flex items-center gap-6">
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={scopeSession}
              onCheckedChange={(v) => (scopeSession = !!v)}
            />
            Cart (Session)
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={scopeItem}
              onCheckedChange={(v) => (scopeItem = !!v)}
            />
            Item
          </label>
        </div>
        {#if scopeError}
          <p class="text-xs text-destructive font-medium">{scopeError}</p>
        {/if}
      </div>

      <!-- API Name -->
      {#if mode === 'edit'}
        <div class="space-y-1.5">
          <div class="flex items-center gap-1.5">
            <Label class="text-sm font-medium">API name</Label>
            <Tooltip.Root>
              <Tooltip.Trigger>
                <CircleHelp size={14} class="text-muted-foreground" />
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>The machine-readable identifier. Cannot be changed after creation.</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </div>
          <div class="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-mono text-muted-foreground">
            {apiName}
          </div>
        </div>
      {:else}
        <div class="space-y-1.5">
          <div class="flex items-center gap-1.5">
            <Label class="text-sm font-medium">API name</Label>
            <Tooltip.Root>
              <Tooltip.Trigger>
                <CircleHelp size={14} class="text-muted-foreground" />
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>The machine-readable identifier. Alphanumeric and underscores only.</p>
              </Tooltip.Content>
            </Tooltip.Root>
          </div>
          <Input
            value={apiName}
            oninput={(e: Event) => {
              apiName = (e.target as HTMLInputElement).value
              apiNameManuallyEdited = true
            }}
            class={apiNameError ? 'border-destructive ring-destructive' : ''}
            placeholder="e.g. shipping_cost"
          />
          {#if apiNameError}
            <p class="text-xs text-destructive font-medium">{apiNameError}</p>
          {/if}
        </div>
      {/if}

      <!-- Rule Builder name (title) -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Rule Builder name</Label>
        <div class="relative">
          <Input
            value={title}
            oninput={(e: Event) => {
              const val = (e.target as HTMLInputElement).value
              if (val.length <= 20) title = val
            }}
            maxlength={20}
            placeholder="e.g. Shipping Cost"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {title.length} / 20
          </span>
        </div>
      </div>

      <!-- Rule Builder description -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Rule Builder description</Label>
        <Input
          value={description}
          oninput={(e: Event) => {
            description = (e.target as HTMLInputElement).value
          }}
          placeholder="e.g. Delivery charges for the purchase."
        />
      </div>

      <!-- Connected Applications -->
      <div class="space-y-2 pt-2">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Connected Applications</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Select which applications can use this cost. Leave empty for all.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <Popover.Root bind:open={appDropdownOpen}>
          <Popover.Trigger
            class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <span class={selectedAppIds.length === 0 ? 'text-muted-foreground' : ''}>
              {selectedAppIds.length === 0
                ? 'All Applications'
                : `${selectedAppIds.length} selected`}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-muted-foreground"
            >
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
                  <div class="text-left">
                    <span class="font-medium">{app.name ?? 'Unnamed'}</span>
                    {#if app.description}
                      <span class="text-muted-foreground ml-2">{app.description}</span>
                    {/if}
                  </div>
                </button>
              {/each}
              {#if applications.length === 0}
                <p class="px-3 py-2 text-sm text-muted-foreground">No applications found.</p>
              {/if}
            </div>
          </Popover.Content>
        </Popover.Root>

        <!-- Selected apps as removable chips -->
        {#if selectedAppIds.length > 0}
          <div class="space-y-1">
            {#each selectedAppIds as appId (appId)}
              {@const app = applications.find((a) => a.id === appId)}
              {#if app}
                <div class="flex items-center justify-between rounded-md border px-3 py-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-sm font-medium truncate">{app.name ?? 'Unnamed'}</span>
                    {#if app.description}
                      <span class="text-sm text-muted-foreground truncate">{app.description}</span>
                    {/if}
                  </div>
                  <button
                    class="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    onclick={() => removeApp(appId)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>

      <!-- Delete Additional Cost (edit mode only) -->
      {#if mode === 'edit'}
        <Separator class="my-2" />
        <div class="space-y-2 pt-2">
          <h3 class="text-base font-medium">Delete Additional Cost</h3>
          <p class="text-sm text-muted-foreground">
            Are you sure you want to delete this additional cost? Ensure your integration does not
            rely on this additional cost before deleting it.
          </p>
          <Button
            variant="outline"
            class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
            onclick={() => (deleteDialogOpen = true)}
          >
            <Trash2 size={14} class="mr-1.5" />
            Delete Additional Cost
          </Button>
        </div>
      {/if}
    </div>

    <Sheet.Footer class="border-t px-6 py-4">
      <Button variant="ghost" onclick={handleCancel} disabled={submitting}>
        Cancel
      </Button>
      <Button onclick={handleSubmit} disabled={submitting}>
        {#if submitting}
          {mode === 'edit' ? 'Saving...' : 'Creating...'}
        {:else}
          {mode === 'edit' ? 'Save' : 'Create Additional Cost'}
        {/if}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>

<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete Additional Cost</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete {cost?.title ?? cost?.name ?? 'this additional cost'}?
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
          Delete Additional Cost
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
