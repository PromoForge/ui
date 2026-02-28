<script lang="ts">
  import type { CustomEffect, CustomEffectParameter, Application } from '$lib/api/generated/types.gen'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
  import { TriangleAlert, Info, X } from 'lucide-svelte'
  import CustomEffectParametersInput from './CustomEffectParametersInput.svelte'
  import CustomEffectPayloadEditor from './CustomEffectPayloadEditor.svelte'

  let {
    mode,
    customEffect,
    applications = [],
    saving = false,
    onSubmit,
    onSave,
    onCancel,
    onDelete,
  }: {
    mode: 'create' | 'edit'
    customEffect?: CustomEffect
    applications?: Application[]
    saving?: boolean
    onSubmit?: (data: {
      apiName: string
      ruleBuilderName: string
      description: string
      scope: string
      applicationIds: number[]
      parameters: CustomEffectParameter[]
      payload: string
    }) => void
    onSave?: (data: {
      ruleBuilderName: string
      description: string
      applicationIds: number[]
      parameters: CustomEffectParameter[]
      payload: string
    }) => void
    onCancel?: () => void
    onDelete?: () => void
  } = $props()

  let scope = $state(customEffect?.scope ?? 'CUSTOM_EFFECT_SCOPE_SESSION')
  let apiName = $state(customEffect?.apiName ?? '')
  let ruleBuilderName = $state(customEffect?.ruleBuilderName ?? '')
  let description = $state(customEffect?.description ?? '')
  let selectedAppIds = $state<number[]>(customEffect?.connectedApplicationIds ?? [])
  let parameters = $state<CustomEffectParameter[]>(customEffect?.parameters ?? [])
  let payload = $state(customEffect?.payload ?? '{}')
  let deleteDialogOpen = $state(false)

  const isValid = $derived(
    apiName.trim().length > 0 &&
    ruleBuilderName.trim().length > 0 &&
    payload.trim().length > 0
  )

  function handleSubmit() {
    if (!isValid) return
    if (mode === 'create') {
      onSubmit?.({
        apiName: apiName.trim(),
        ruleBuilderName: ruleBuilderName.trim(),
        description: description.trim(),
        scope,
        applicationIds: selectedAppIds,
        parameters,
        payload,
      })
    } else {
      onSave?.({
        ruleBuilderName: ruleBuilderName.trim(),
        description: description.trim(),
        applicationIds: selectedAppIds,
        parameters,
        payload,
      })
    }
  }

  function toggleApp(appId: number) {
    if (selectedAppIds.includes(appId)) {
      selectedAppIds = selectedAppIds.filter((id) => id !== appId)
    } else {
      selectedAppIds = [...selectedAppIds, appId]
    }
  }

  function getAppName(id: number): string {
    return applications.find((a) => a.id === id)?.name ?? `App ${id}`
  }
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit() }} class="space-y-8">
  <!-- Warning Banner -->
  {#if mode === 'create'}
    <div class="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4">
      <TriangleAlert size={18} class="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <p class="text-sm text-amber-800 dark:text-amber-200">
        The custom effect scope cannot be changed after the custom effect is created.
      </p>
    </div>
  {:else}
    <div class="flex items-start gap-3 rounded-md border border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700 p-4">
      <Info size={18} class="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <p class="text-sm text-blue-800 dark:text-blue-200">
        You cannot change the parameters of custom effects used in rules.
      </p>
    </div>
  {/if}

  <!-- Properties Section -->
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Properties</h2>

    <!-- Scope -->
    <div class="space-y-2">
      <Label>Scope</Label>
      <RadioGroup.Root
        value={scope}
        onValueChange={(val) => { if (val) scope = val as typeof scope }}
        disabled={mode === 'edit'}
        class="flex gap-4"
      >
        <div class="flex items-center gap-2">
          <RadioGroup.Item value="CUSTOM_EFFECT_SCOPE_SESSION" id="scope-session" />
          <Label for="scope-session" class="font-normal">Cart (Session)</Label>
        </div>
        <div class="flex items-center gap-2">
          <RadioGroup.Item value="CUSTOM_EFFECT_SCOPE_CART_ITEM" id="scope-item" />
          <Label for="scope-item" class="font-normal">Item</Label>
        </div>
      </RadioGroup.Root>
    </div>

    <!-- API name + Rule Builder name -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <Label for="api-name">API name</Label>
        <Input
          id="api-name"
          value={apiName}
          placeholder="Type effect name (API)"
          oninput={(e: Event) => (apiName = (e.target as HTMLInputElement).value)}
          disabled={mode === 'edit'}
        />
      </div>
      <div class="space-y-1.5">
        <Label for="rb-name">Rule Builder name</Label>
        <Input
          id="rb-name"
          value={ruleBuilderName}
          placeholder="Type effect name (Rule Builder)"
          oninput={(e: Event) => (ruleBuilderName = (e.target as HTMLInputElement).value)}
        />
      </div>
    </div>

    <!-- Description + Applications -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <Label for="description">Custom effect description</Label>
        <Input
          id="description"
          value={description}
          placeholder="Description"
          oninput={(e: Event) => (description = (e.target as HTMLInputElement).value)}
        />
      </div>
      <div class="space-y-1.5">
        <Label>Applications</Label>
        <div class="relative">
          <div class="flex flex-wrap gap-1 min-h-[38px] rounded-md border border-input bg-background px-3 py-1.5 text-sm">
            {#each selectedAppIds as appId (appId)}
              <span class="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                {getAppName(appId)}
                <button type="button" class="hover:text-destructive cursor-pointer" onclick={() => toggleApp(appId)}>
                  <X size={12} />
                </button>
              </span>
            {/each}
          </div>
          {#if applications.length > 0}
            <div class="mt-1 border rounded-md max-h-40 overflow-y-auto">
              {#each applications as app (app.id)}
                {#if app.id != null && !selectedAppIds.includes(app.id)}
                  <button
                    type="button"
                    class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted cursor-pointer"
                    onclick={() => { if (app.id != null) toggleApp(app.id) }}
                  >
                    {app.name ?? `App ${app.id}`}
                  </button>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Parameters Section -->
  <CustomEffectParametersInput bind:parameters />

  <!-- Payload Section -->
  <CustomEffectPayloadEditor bind:value={payload} />

  <!-- Actions -->
  <div class="flex justify-end gap-3 pt-4 border-t">
    <Button type="button" variant="ghost" onclick={() => onCancel?.()}>Cancel</Button>

    {#if mode === 'edit' && onDelete}
      <AlertDialog.Root bind:open={deleteDialogOpen}>
        <AlertDialog.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline" class="text-destructive border-destructive hover:bg-destructive/10">
              Delete Custom Effect
            </Button>
          {/snippet}
        </AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Delete Custom Effect</AlertDialog.Title>
            <AlertDialog.Description>
              Are you sure you want to delete this custom effect? This action cannot be undone.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
              class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onclick={() => onDelete?.()}
            >
              Delete Custom Effect
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Root>
    {/if}

    <Button type="submit" disabled={!isValid || saving}>
      {mode === 'create' ? 'Create' : 'Save'}
    </Button>
  </div>
</form>
