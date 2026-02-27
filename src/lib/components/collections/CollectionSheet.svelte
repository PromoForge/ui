<script lang="ts">
  import type {
    Application,
    Collection,
    CreateAccountCollectionRequest,
    UpdateAccountCollectionRequest,
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
  import { CircleHelp, Trash2, Upload, Download, TriangleAlert } from 'lucide-svelte'

  let {
    mode = 'create',
    collection = undefined,
    open = false,
    onOpenChange,
    onSubmit,
    onUpdate,
    onDelete,
    onImportItems,
    onExportItems,
    applications = [],
  }: {
    mode?: 'create' | 'edit'
    collection?: Collection
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit?: (request: CreateAccountCollectionRequest) => Promise<void>
    onUpdate?: (request: Omit<UpdateAccountCollectionRequest, 'collectionId'>) => Promise<void>
    onDelete?: (collectionId: number) => Promise<void>
    onImportItems?: (collectionId: number, csvData: string) => Promise<void>
    onExportItems?: (collectionId: number) => Promise<string>
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
  let importingCreate = $state(false)
  let createCsvData = $state<string | null>(null)
  let createCsvFileName = $state<string | null>(null)

  // Delete dialog state
  let deleteDialogOpen = $state(false)
  let deleting = $state(false)
  let deleteError = $state('')

  // Import state (edit mode)
  let importing = $state(false)
  let importError = $state('')
  let exporting = $state(false)

  // Validation
  const nameError = $derived(attempted && !name.trim() ? 'Name is required' : '')

  // Pre-populate form in edit mode
  $effect(() => {
    if (mode === 'edit' && collection && open) {
      name = collection.name ?? ''
      description = collection.description ?? ''
      selectedAppIds = collection.subscribedApplicationsIds
        ? [...collection.subscribedApplicationsIds]
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
    importingCreate = false
    createCsvData = null
    createCsvFileName = null
    importing = false
    importError = ''
    exporting = false
  }

  function handleCancel() {
    resetForm()
    onOpenChange(false)
  }

  function downloadSampleCsv() {
    const csv = 'item\nexample_sku_001\nexample_sku_002\nexample_sku_003\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'collection_sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleCreateCsvUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    importingCreate = true
    createCsvFileName = file.name
    const reader = new FileReader()
    reader.onload = () => {
      createCsvData = reader.result as string
      importingCreate = false
    }
    reader.onerror = () => {
      importingCreate = false
      createCsvData = null
      createCsvFileName = null
    }
    reader.readAsText(file)
    input.value = ''
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
        const request: CreateAccountCollectionRequest = {
          name: name.trim(),
          description: description.trim() || undefined,
          subscribedApplicationsIds,
        }
        await onSubmit?.(request)
      } else {
        const request: Omit<UpdateAccountCollectionRequest, 'collectionId'> = {
          name: name.trim(),
          description: description.trim() || undefined,
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
            ? 'Failed to create collection'
            : 'Failed to update collection'
    } finally {
      submitting = false
    }
  }

  async function handleCsvUpload(event: Event) {
    if (!collection?.id) return
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    importing = true
    importError = ''
    try {
      const csvData = await file.text()
      await onImportItems?.(collection.id, csvData)
    } catch (e) {
      importError = e instanceof Error ? e.message : 'Failed to import items'
    } finally {
      importing = false
      input.value = ''
    }
  }

  async function handleExport() {
    if (!collection?.id) return
    exporting = true
    try {
      const csvData = await onExportItems?.(collection.id)
      if (csvData) {
        const blob = new Blob([csvData], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${collection.name ?? 'collection'}_items.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      exporting = false
    }
  }

  async function handleDelete() {
    if (!collection?.id) return
    deleting = true
    deleteError = ''
    try {
      await onDelete?.(collection.id)
      deleteDialogOpen = false
      resetForm()
      onOpenChange(false)
    } catch (e) {
      deleteError =
        e instanceof Error ? e.message : 'Failed to delete collection'
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
        {mode === 'edit' ? 'Edit Collection' : 'Create Collection'}
      </Sheet.Title>
      <Sheet.Description class="text-sm text-foreground">
        {#if mode === 'edit'}
          Edit the list of imported items that you can use in your rules. For example, a list of SKUs or email addresses to allow or block for a campaign.
        {:else}
          Create a list of items you can use in your rules. For example, a list of SKUs or email addresses to allow or block for a campaign.
        {/if}
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
      {#if submitError}
        <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      {/if}

      <!-- Name -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Name</Label>
        <Input
          value={name}
          oninput={(e: Event) => {
            name = (e.target as HTMLInputElement).value
          }}
          class={nameError ? 'border-destructive ring-destructive' : ''}
          placeholder=""
        />
        {#if nameError}
          <p class="text-xs text-destructive font-medium">{nameError}</p>
        {/if}
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Description (optional)</Label>
        <textarea
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          value={description}
          oninput={(e: Event) => {
            description = (e.target as HTMLTextAreaElement).value
          }}
        ></textarea>
      </div>

      <!-- Connected Applications -->
      <div class="space-y-2">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Connected Applications</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Select which applications can use this collection.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <Popover.Root bind:open={appDropdownOpen}>
          <Popover.Trigger
            class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <span class={selectedAppIds.length === 0 ? 'text-muted-foreground' : ''}>
              {selectedAppIds.length === 0
                ? 'Select Applications'
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

      <!-- Import Items (create mode) -->
      {#if mode === 'create'}
        <Separator class="my-2" />
        <div class="space-y-2 pt-2">
          <h3 class="text-base font-medium">Import items (optional)</h3>
          <p class="text-sm text-muted-foreground">
            Upload a CSV file containing the items to import into your collection. To see the required structure, <button class="text-primary hover:underline cursor-pointer" onclick={downloadSampleCsv}>download a sample file</button>.
          </p>
          <div class="flex items-center gap-2">
            <label class="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer">
              <Upload size={14} />
              Upload a CSV File
              <input
                type="file"
                accept=".csv"
                class="hidden"
                onchange={handleCreateCsvUpload}
              />
            </label>
          </div>
          {#if createCsvFileName}
            <p class="text-sm text-muted-foreground">
              Selected: {createCsvFileName}
            </p>
          {/if}
        </div>
      {/if}

      <!-- Manage Items (edit mode) -->
      {#if mode === 'edit'}
        <Separator class="my-2" />
        <div class="space-y-3 pt-2">
          <h3 class="text-base font-medium">Manage items</h3>
          <div class="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            <TriangleAlert size={16} class="shrink-0" />
            Uploading a new list of items replaces the current list.
          </div>
          <p class="text-sm text-muted-foreground">
            Export a list of your collection items, or upload a new CSV file containing a maximum of 500,000 items to import into your collection. For reference, <button class="text-primary hover:underline cursor-pointer" onclick={downloadSampleCsv}>download a sample file</button>.
          </p>
          {#if importError}
            <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {importError}
            </div>
          {/if}
          <div class="flex items-center gap-2">
            <Button variant="outline" onclick={handleExport} disabled={exporting}>
              <Download size={14} class="mr-1.5" />
              {exporting ? 'Exporting...' : 'Export Items'}
            </Button>
            <label class="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer {importing ? 'opacity-50 pointer-events-none' : ''}">
              <Upload size={14} />
              {importing ? 'Uploading...' : 'Upload a CSV File'}
              <input
                type="file"
                accept=".csv"
                class="hidden"
                onchange={handleCsvUpload}
                disabled={importing}
              />
            </label>
          </div>
        </div>
      {/if}

      <!-- Delete Collection (edit mode only) -->
      {#if mode === 'edit'}
        <Separator class="my-2" />
        <div class="space-y-2 pt-2">
          <h3 class="text-base font-medium text-destructive">Delete collection</h3>
          <p class="text-sm text-muted-foreground">
            Deleting the collection also deletes its items. This action cannot be undone.
          </p>
          <Button
            variant="outline"
            class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
            onclick={() => (deleteDialogOpen = true)}
          >
            <Trash2 size={14} class="mr-1.5" />
            Delete Collection
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
          {mode === 'edit' ? 'Save' : 'Create Collection'}
        {/if}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>

<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete Collection</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete {collection?.name ?? 'this collection'}?
        This action is permanent and will also delete all items in the collection.
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
          Delete Collection
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
