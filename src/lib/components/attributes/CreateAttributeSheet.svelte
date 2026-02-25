<script lang="ts">
  import type { Application, CreateAttributeRequest } from '$lib/api/generated/types.gen'
  import { ENTITY_LABELS, TYPE_LABELS } from '$lib/stores/attributeStore.svelte'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import * as Alert from '$lib/components/ui/alert/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { Calendar } from '$lib/components/ui/calendar/index.js'
  import { CircleHelp, Info, X, Upload, Trash2 } from 'lucide-svelte'
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
  let selectedAppIds = $state<number[]>([])
  let appDropdownOpen = $state(false)
  let submitting = $state(false)
  let attempted = $state(false)
  let apiNameManuallyEdited = $state(false)
  let submitError = $state('')

  // Picklist state
  let suggestions = $state<string[]>([])
  let tagInputValue = $state('')
  let allowCustomValues = $state(false)
  let csvFileName = $state('')
  let datePickerOpen = $state(false)

  // Types that show picklist section
  const PICKLIST_TYPES = [
    'ATTRIBUTE_TYPE_STRING',
    'ATTRIBUTE_TYPE_NUMBER',
    'ATTRIBUTE_TYPE_LIST_OF_STRINGS',
    'ATTRIBUTE_TYPE_LIST_OF_NUMBERS',
    'ATTRIBUTE_TYPE_TIME'
  ]

  const NUMBER_TYPES = [
    'ATTRIBUTE_TYPE_NUMBER',
    'ATTRIBUTE_TYPE_LIST_OF_NUMBERS'
  ]

  const showPicklist = $derived(PICKLIST_TYPES.includes(type))
  const isTimeType = $derived(type === 'ATTRIBUTE_TYPE_TIME')
  const isNumberType = $derived(NUMBER_TYPES.includes(type))

  function addTag(value: string) {
    const trimmed = value.trim()
    if (!trimmed || suggestions.length >= 50) return
    if (isNumberType && isNaN(Number(trimmed))) return
    if (!suggestions.includes(trimmed)) {
      suggestions = [...suggestions, trimmed]
    }
    tagInputValue = ''
  }

  function removeTag(index: number) {
    suggestions = suggestions.filter((_, i) => i !== index)
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInputValue)
    }
    if (e.key === 'Backspace' && !tagInputValue && suggestions.length > 0) {
      suggestions = suggestions.slice(0, -1)
    }
  }

  function handleDateSelect(date: any) {
    if (!date || suggestions.length >= 50) return
    const formatted = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date.toDate('UTC'))
    if (!suggestions.includes(formatted)) {
      suggestions = [...suggestions, formatted]
    }
    datePickerOpen = false
  }

  function handleCsvUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    csvFileName = file.name
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const values = text
        .split(/[\r\n,]+/)
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
      if (isNumberType) {
        suggestions = values.filter((v) => !isNaN(Number(v))).slice(0, 50)
      } else {
        suggestions = values.slice(0, 50)
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be re-uploaded
    input.value = ''
  }

  function downloadSampleCsv() {
    const content = isNumberType ? '100\n200\n300' : 'value1\nvalue2\nvalue3'
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_values.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

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

  // Clear picklist when type changes
  $effect(() => {
    // Read `type` to track it
    type;
    suggestions = []
    tagInputValue = ''
    allowCustomValues = false
    csvFileName = ''
  })

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
    suggestions = []
    tagInputValue = ''
    allowCustomValues = false
    csvFileName = ''
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

    if (!entity || !type || !apiName || !/^[a-zA-Z0-9_]+$/.test(apiName)) {
      return
    }

    submitting = true
    try {
      const subscribedApplicationsIds = selectedAppIds.length > 0 ? selectedAppIds : undefined
      await onSubmit({
        entity: entity as CreateAttributeRequest['entity'],
        type: type as CreateAttributeRequest['type'],
        name: apiName,
        title: name || undefined,
        description: description || undefined,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        hasAllowedList: suggestions.length > 0 ? true : undefined,
        restrictedBySuggestions: showPicklist ? !allowCustomValues : undefined,
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

      <!-- Picklist Values (conditional on type) -->
      {#if showPicklist}
        <div class="space-y-3 pt-2">
          <h3 class="text-base font-medium">Picklist values</h3>
          <p class="text-sm text-muted-foreground">
            Picklist values are predefined values for this attribute. Use them to control
            what values users can select for this attribute when they use it in a rule.
          </p>

          <Alert.Root>
            <Info size={14} />
            <Alert.Description>
              {#if isTimeType}
                Enter up to 50 values.
              {:else}
                Enter up to 50 values, each separated by a comma. If you need to enter more
                values, import a CSV file instead.
              {/if}
            </Alert.Description>
          </Alert.Root>

          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={allowCustomValues}
              onCheckedChange={(v) => (allowCustomValues = !!v)}
            />
            Allow users to enter custom values in the Rule Builder
          </label>

          <div class="space-y-1.5">
            <Label class="text-sm font-medium">Values</Label>

            {#if isTimeType}
              <!-- Date picker tag input -->
              <div class="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 min-h-[40px]">
                {#each suggestions as value, i (value)}
                  <Badge variant="secondary" class="gap-1 pl-2.5 pr-1 py-1">
                    {value}
                    <button
                      class="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 cursor-pointer"
                      onclick={() => removeTag(i)}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                {/each}
                {#if suggestions.length < 50}
                  <Popover.Root bind:open={datePickerOpen}>
                    <Popover.Trigger class="text-sm text-muted-foreground hover:text-foreground cursor-pointer px-1">
                      + Add date
                    </Popover.Trigger>
                    <Popover.Content class="w-auto p-0" align="start">
                      <Calendar type="single" onValueChange={handleDateSelect} />
                    </Popover.Content>
                  </Popover.Root>
                {/if}
              </div>
            {:else}
              <!-- Text tag input -->
              <div class="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 min-h-[40px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                {#each suggestions as value, i (value)}
                  <Badge variant="secondary" class="gap-1 pl-2.5 pr-1 py-1">
                    {value}
                    <button
                      class="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 cursor-pointer"
                      onclick={() => removeTag(i)}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                {/each}
                {#if suggestions.length < 50}
                  <input
                    type="text"
                    class="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder={suggestions.length === 0 ? (isNumberType ? 'Type a number and press Enter...' : 'Type a value and press Enter...') : ''}
                    bind:value={tagInputValue}
                    onkeydown={handleTagKeydown}
                    onblur={() => { if (tagInputValue) addTag(tagInputValue) }}
                  />
                {/if}
              </div>
            {/if}

            {#if suggestions.length > 0}
              <p class="text-xs text-muted-foreground">{suggestions.length} / 50 values</p>
            {/if}
          </div>

          <!-- CSV Upload -->
          <div class="space-y-2 pt-1">
            <p class="text-sm text-muted-foreground">
              Import a CSV file of up to 500,000 values. The import overwrites any entered
              values and previous imports.
              <button
                class="text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer"
                onclick={downloadSampleCsv}
              >
                Download a sample CSV file.
              </button>
            </p>
            <label class="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
              <Upload size={14} />
              Upload a CSV file
              <input
                type="file"
                accept=".csv"
                class="hidden"
                onchange={handleCsvUpload}
              />
            </label>
          </div>
        </div>
      {/if}

      <!-- Connected Applications -->
      <div class="space-y-2 pt-2">
        <h3 class="text-base font-medium">Connected Applications</h3>
        <p class="text-sm text-muted-foreground">
          Select the Applications where you want to use the attribute. If you choose none,
          it will be available in all Applications.
        </p>
        <Popover.Root bind:open={appDropdownOpen}>
          <Popover.Trigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground cursor-pointer">
            <span class={selectedAppIds.length === 0 ? 'text-muted-foreground' : ''}>
              {selectedAppIds.length === 0 ? 'Select Applications' : `${selectedAppIds.length} selected`}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="m6 9 6 6 6-6"/></svg>
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

        <!-- Selected apps list -->
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
