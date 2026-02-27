<script lang="ts">
  import type {
    Application,
    Catalog,
    CreateCatalogRequest,
    UpdateCatalogRequest,
  } from '$lib/api/generated/types.gen'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import { CircleHelp, Trash2 } from 'lucide-svelte'

  let {
    mode = 'create',
    catalog = undefined,
    open = false,
    onOpenChange,
    onSubmit,
    onUpdate,
    onDelete,
    applications = [],
  }: {
    mode?: 'create' | 'edit'
    catalog?: Catalog
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit?: (request: CreateCatalogRequest) => Promise<void>
    onUpdate?: (request: Omit<UpdateCatalogRequest, 'catalogId'>) => Promise<void>
    onDelete?: (catalogId: number) => Promise<void>
    applications: Application[]
  } = $props()

  // Form state
  let name = $state('')
  let description = $state('')
  let selectedAppIds = $state<number[]>([])
  let appDropdownOpen = $state(false)
  let submitting = $state(false)
  let attempted = $state(false)
  let submitError = $state('')

  // Delete dialog state
  let deleteDialogOpen = $state(false)
  let deleting = $state(false)
  let deleteError = $state('')

  // Validation
  const nameError = $derived(attempted && !name.trim() ? 'Name is required' : '')
  const descriptionLength = $derived(description.length)

  // Pre-populate form in edit mode
  $effect(() => {
    if (mode === 'edit' && catalog && open) {
      name = catalog.name ?? ''
      description = catalog.description ?? ''
      selectedAppIds = catalog.subscribedApplicationsIds
        ? [...catalog.subscribedApplicationsIds]
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

  function removeApp(appId: number) {
    selectedAppIds = selectedAppIds.filter((id) => id !== appId)
  }

  function resetForm() {
    name = ''
    description = ''
    selectedAppIds = []
    appDropdownOpen = false
    submitting = false
    attempted = false
    submitError = ''
  }

  function handleCancel() {
    resetForm()
    onOpenChange(false)
  }

  async function handleSubmit() {
    attempted = true
    submitError = ''
    if (!name.trim()) return

    submitting = true
    try {
      const subscribedApplicationsIds =
        selectedAppIds.length > 0 ? selectedAppIds : undefined

      if (mode === 'create') {
        await onSubmit?.({
          name: name.trim(),
          description: description.trim() || undefined,
          subscribedApplicationsIds,
        })
      } else {
        await onUpdate?.({
          name: name.trim(),
          description: description.trim() || undefined,
          subscribedApplicationsIds,
        })
      }
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError =
        e instanceof Error
          ? e.message
          : mode === 'create'
            ? 'Failed to create catalog'
            : 'Failed to update catalog'
    } finally {
      submitting = false
    }
  }

  async function handleDelete() {
    if (!catalog?.id) return
    deleting = true
    deleteError = ''
    try {
      await onDelete?.(catalog.id)
      deleteDialogOpen = false
      resetForm()
      onOpenChange(false)
    } catch (e) {
      deleteError = e instanceof Error ? e.message : 'Failed to delete catalog'
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
      <Sheet.Title class="sr-only">
        {mode === 'edit' ? 'Edit Catalog' : 'Create Catalog'}
      </Sheet.Title>
      <Sheet.Description class="text-sm text-foreground">
        Edit the name, description, and connected Applications of the catalog.
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
      {#if submitError}
        <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      {/if}

      <!-- Catalog name -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Catalog name</Label>
        <Input
          value={name}
          oninput={(e: Event) => {
            name = (e.target as HTMLInputElement).value
          }}
          class={nameError ? 'border-destructive ring-destructive' : ''}
        />
        {#if nameError}
          <p class="text-xs text-destructive font-medium">{nameError}</p>
        {/if}
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Description</Label>
        <textarea
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          value={description}
          maxlength={200}
          oninput={(e: Event) => {
            description = (e.target as HTMLTextAreaElement).value
          }}
        ></textarea>
        <p class="text-xs text-muted-foreground text-right">{descriptionLength} / 200</p>
      </div>

      <!-- Connected Applications -->
      <div class="space-y-2">
        <div class="flex items-center gap-1.5">
          <h3 class="text-base font-medium">Connected Applications</h3>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Select the Applications you want to connect to the catalog.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <p class="text-sm text-muted-foreground">
          Select the Applications you want to connect to the catalog.
        </p>
        <Popover.Root bind:open={appDropdownOpen}>
          <Popover.Trigger
            class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <span class={selectedAppIds.length === 0 ? 'text-muted-foreground' : ''}>
              {selectedAppIds.length === 0
                ? 'Select Application'
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

        <!-- Existing Connections label + selected apps as chips -->
        {#if selectedAppIds.length > 0}
          <p class="text-sm font-medium text-muted-foreground">Existing Connections</p>
          <div class="space-y-1">
            {#each selectedAppIds as appId (appId)}
              {@const app = applications.find((a) => a.id === appId)}
              {#if app}
                <div class="flex items-center justify-between rounded-md border px-3 py-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-sm font-medium truncate">{app.name ?? 'Unnamed'}</span>
                    {#if app.description}
                      <span class="text-sm text-muted-foreground truncate"
                        >{app.description}</span
                      >
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

      <!-- Delete Catalog (edit mode only) -->
      {#if mode === 'edit'}
        <Separator class="my-2" />
        <div class="space-y-2 pt-2">
          <h3 class="text-base font-medium text-destructive">Delete catalog</h3>
          <p class="text-sm text-muted-foreground">
            Deleting the catalog also deletes its items. This action cannot be undone.
          </p>
          <Button
            variant="outline"
            class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
            onclick={() => (deleteDialogOpen = true)}
          >
            <Trash2 size={14} class="mr-1.5" />
            Delete Catalog
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
          {mode === 'edit' ? 'Save' : 'Create Catalog'}
        {/if}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>

<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete Catalog</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete {catalog?.name ?? 'this catalog'}?
        This action is permanent and will also delete all items in the catalog.
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
          Delete Catalog
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
