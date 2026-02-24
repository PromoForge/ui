<script lang="ts">
  import type { Application } from '$lib/api/generated/types.gen'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Alert from '$lib/components/ui/alert/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { CircleAlert, Check } from 'lucide-svelte'

  let {
    application
  }: {
    application: Application
  } = $props()

  type CaseSensitivity = NonNullable<Application['caseSensitivity']>

  let caseSensitivity = $state<CaseSensitivity>('CASE_SENSITIVITY_SENSITIVE')
  let saving = $state(false)
  let error = $state('')
  let success = $state(false)

  $effect(() => {
    caseSensitivity = application.caseSensitivity ?? 'CASE_SENSITIVITY_SENSITIVE'
  })

  const hasChanges = $derived(
    caseSensitivity !== (application.caseSensitivity ?? 'CASE_SENSITIVITY_SENSITIVE')
  )

  const caseSensitivityOptions: { value: CaseSensitivity; label: string; description: string }[] = [
    { value: 'CASE_SENSITIVITY_SENSITIVE', label: 'Case Sensitive', description: 'Coupon codes and identifiers are matched exactly as entered' },
    { value: 'CASE_SENSITIVITY_INSENSITIVE_UPPERCASE', label: 'Insensitive (Uppercase)', description: 'Values are normalized to uppercase before matching' },
    { value: 'CASE_SENSITIVITY_INSENSITIVE_LOWERCASE', label: 'Insensitive (Lowercase)', description: 'Values are normalized to lowercase before matching' }
  ]

  function handleCancel() {
    caseSensitivity = application.caseSensitivity ?? 'CASE_SENSITIVITY_SENSITIVE'
    error = ''
    success = false
  }

  async function handleSave() {
    saving = true
    error = ''
    success = false
    try {
      await applicationStore.updateApplication(application.id!, {
        caseSensitivity
      })
      success = true
      setTimeout(() => (success = false), 3000)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update settings'
    } finally {
      saving = false
    }
  }
</script>

<div class="max-w-2xl">
  <p class="text-sm text-muted-foreground">
    Configure matching behavior for this application.
  </p>

  {#if error}
    <Alert.Root variant="destructive" class="mt-4">
      <CircleAlert class="size-4" />
      <Alert.Description>{error}</Alert.Description>
    </Alert.Root>
  {/if}

  {#if success}
    <Alert.Root class="mt-4 border-success/30 bg-success/5 text-success">
      <Check class="size-4" />
      <Alert.Description>Settings saved successfully.</Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Case Sensitivity -->
  <Card.Root class="mt-6">
    <Card.Header>
      <Card.Title class="text-base">Case Sensitivity</Card.Title>
      <Card.Description>
        Controls how coupon codes, attribute values, and other identifiers are matched.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex flex-col gap-2">
        {#each caseSensitivityOptions as opt (opt.value)}
          <button
            type="button"
            class="flex items-start gap-3 rounded-lg border-2 p-3.5 text-left transition-colors {caseSensitivity === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}"
            onclick={() => (caseSensitivity = opt.value)}
          >
            <div class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 {caseSensitivity === opt.value ? 'border-primary bg-primary' : 'border-muted-foreground/40'}">
              {#if caseSensitivity === opt.value}
                <div class="size-1.5 rounded-full bg-white"></div>
              {/if}
            </div>
            <div>
              <p class="text-sm font-medium">{opt.label}</p>
              <p class="text-xs text-muted-foreground">{opt.description}</p>
            </div>
          </button>
        {/each}
      </div>
    </Card.Content>
  </Card.Root>

  <div class="mt-6 flex items-center justify-end gap-3">
    <Button variant="ghost" onclick={handleCancel} disabled={saving}>Cancel</Button>
    <Button onclick={handleSave} disabled={!hasChanges || saving}>
      {#if saving}
        Saving...
      {:else if hasChanges}
        Save Changes
      {:else}
        No Changes
      {/if}
    </Button>
  </div>
</div>
