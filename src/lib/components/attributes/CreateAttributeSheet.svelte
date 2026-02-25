<script lang="ts">
  import type { Application, CreateAttributeRequest } from '$lib/api/generated/types.gen'
  import { ENTITY_LABELS, TYPE_LABELS } from '$lib/stores/attributeStore.svelte'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { CircleHelp } from 'lucide-svelte'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

  let {
    open = false,
    onOpenChange,
    onSubmit,
    applications = []
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (request: CreateAttributeRequest) => Promise<void>
    applications: Application[]
  } = $props()

  // Form state
  let entity = $state('')
  let type = $state('')
  let apiName = $state('')
  let name = $state('')
  let description = $state('')
  let selectedAppId = $state('all')
  let submitting = $state(false)
  let attempted = $state(false)
  let apiNameManuallyEdited = $state(false)
  let submitError = $state('')

  // Auto-slug generation
  $effect(() => {
    if (!apiNameManuallyEdited && name) {
      apiName = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
    }
  })

  // Validation
  const entityError = $derived(attempted && !entity ? 'Required' : '')
  const typeError = $derived(attempted && !type ? 'Required' : '')
  const apiNameError = $derived(
    attempted && !apiName
      ? 'Required'
      : apiName && !/^[a-zA-Z0-9_]+$/.test(apiName)
        ? 'Only letters, numbers, and underscores'
        : ''
  )

  function resetForm() {
    entity = ''
    type = ''
    apiName = ''
    name = ''
    description = ''
    selectedAppId = 'all'
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

    if (!entity || !type || !apiName || !/^[a-zA-Z0-9_]+$/.test(apiName)) {
      return
    }

    submitting = true
    try {
      const subscribedApplicationsIds = selectedAppId !== 'all' ? [Number(selectedAppId)] : undefined
      await onSubmit({
        entity: entity as CreateAttributeRequest['entity'],
        type: type as CreateAttributeRequest['type'],
        name: apiName,
        title: name || undefined,
        description: description || undefined,
        subscribedApplicationsIds
      })
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError = e instanceof Error ? e.message : 'Failed to create attribute'
    } finally {
      submitting = false
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
      <Sheet.Title>Create Attribute</Sheet.Title>
      <Sheet.Description class="text-sm text-foreground">
        To send specific data to PromoForge, create custom attributes, set a value for them via
        the integration API or via the Campaign Manager, and use them in your rules.
      </Sheet.Description>
    </Sheet.Header>

    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
      {#if submitError}
        <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      {/if}

      <!-- Entity -->
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Entity</Label>
        <Select.Root type="single" bind:value={entity}>
          <Select.Trigger
            class="w-full {entityError ? 'border-destructive ring-destructive' : ''}"
          >
            {entity ? ENTITY_LABELS[entity] ?? entity : 'Select entity...'}
          </Select.Trigger>
          <Select.Content>
            {#each Object.entries(ENTITY_LABELS) as [value, label] (value)}
              <Select.Item {value} {label} />
            {/each}
          </Select.Content>
        </Select.Root>
        {#if entityError}
          <p class="text-xs text-destructive font-medium">{entityError}</p>
        {/if}
      </div>

      <!-- Type -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Type</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>The data type for this attribute's values.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <Select.Root type="single" bind:value={type}>
          <Select.Trigger
            class="w-full {typeError ? 'border-destructive ring-destructive' : ''}"
          >
            {type ? TYPE_LABELS[type] ?? type : 'Select type...'}
          </Select.Trigger>
          <Select.Content>
            {#each Object.entries(TYPE_LABELS) as [value, label] (value)}
              <Select.Item {value} {label} />
            {/each}
          </Select.Content>
        </Select.Root>
        {#if typeError}
          <p class="text-xs text-destructive font-medium">{typeError}</p>
        {/if}
      </div>

      <!-- API Name -->
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
          placeholder="e.g. order_status"
        />
        {#if apiNameError}
          <p class="text-xs text-destructive font-medium">{apiNameError}</p>
        {/if}
      </div>

      <!-- Name (title) -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Name</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Human-readable display name for this attribute.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <div class="relative">
          <Input
            value={name}
            oninput={(e: Event) => {
              const val = (e.target as HTMLInputElement).value
              if (val.length <= 20) name = val
            }}
            maxlength={20}
            placeholder="e.g. Order Status"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {name.length} / 20
          </span>
        </div>
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <Label class="text-sm font-medium">Description</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={14} class="text-muted-foreground" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Optional description for documentation purposes.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
        <Textarea
          bind:value={description}
          rows={4}
          placeholder="Describe what this attribute is used for..."
        />
      </div>

      <!-- Connected Applications -->
      <div class="space-y-2 pt-2">
        <h3 class="text-base font-medium">Connected Applications</h3>
        <p class="text-sm text-muted-foreground">
          Select the Applications where you want to use the attribute. If you choose none,
          it will be available in all Applications.
        </p>
        <Select.Root type="single" bind:value={selectedAppId}>
          <Select.Trigger class="w-full">
            {selectedAppId === 'all'
              ? 'All Applications'
              : applications.find((a) => String(a.id) === selectedAppId)?.name ?? 'Selected'}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all" label="All Applications" />
            {#each applications as app (app.id)}
              <Select.Item value={String(app.id)} label={app.name ?? ''} />
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>

    <Sheet.Footer class="border-t px-6 py-4">
      <Button variant="ghost" onclick={handleCancel} disabled={submitting}>
        Cancel
      </Button>
      <Button onclick={handleSubmit} disabled={submitting}>
        {#if submitting}
          Creating...
        {:else}
          Create Attribute
        {/if}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
