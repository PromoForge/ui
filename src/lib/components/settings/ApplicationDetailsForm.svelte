<script lang="ts">
  import type { Application } from '$lib/api/generated/types.gen'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import { currencyOptions, timezoneOptions } from '$lib/constants/applicationOptions'
  import * as Select from '$lib/components/ui/select/index.js'
  import * as Alert from '$lib/components/ui/alert/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { CircleAlert } from 'lucide-svelte'

  let {
    application
  }: {
    application: Application
  } = $props()

  let name = $state(application.name ?? '')
  let description = $state(application.description ?? '')
  let currency = $state(application.currency ?? 'SAR')
  let timezone = $state(application.timezone ?? 'Asia/Riyadh')
  let saving = $state(false)
  let error = $state('')
  let success = $state(false)

  const hasChanges = $derived(
    name !== (application.name ?? '') ||
    description !== (application.description ?? '') ||
    currency !== (application.currency ?? 'SAR') ||
    timezone !== (application.timezone ?? 'Asia/Riyadh')
  )

  function handleCancel() {
    name = application.name ?? ''
    description = application.description ?? ''
    currency = application.currency ?? 'SAR'
    timezone = application.timezone ?? 'Asia/Riyadh'
    error = ''
    success = false
  }

  async function handleSave() {
    if (!name.trim()) {
      error = 'Name is required'
      return
    }

    saving = true
    error = ''
    success = false
    try {
      await applicationStore.updateApplication(application.id!, {
        name: name.trim(),
        description: description.trim() || undefined,
        currency,
        timezone
      })
      success = true
      setTimeout(() => (success = false), 3000)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update application'
    } finally {
      saving = false
    }
  }
</script>

<div class="max-w-2xl">
  <p class="text-sm text-muted-foreground">
    Change the name, description, currency, and time zone of your Application at any time.
  </p>

  {#if error}
    <Alert.Root variant="destructive" class="mt-4">
      <CircleAlert class="size-4" />
      <Alert.Description>{error}</Alert.Description>
    </Alert.Root>
  {/if}

  <div class="mt-6 flex flex-col gap-6">
    <div class="flex flex-col gap-1.5">
      <Label class="text-sm font-medium">Name</Label>
      <Input bind:value={name} class="max-w-sm" />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="text-sm font-medium">Description</Label>
      <Textarea bind:value={description} class="max-w-sm" rows={4} />
    </div>

    <div class="grid grid-cols-2 gap-4 max-w-sm">
      <div class="flex flex-col gap-1.5">
        <Label class="text-sm font-medium">Currency</Label>
        <Select.Root type="single" bind:value={currency}>
          <Select.Trigger class="w-full">
            {currencyOptions.find(o => o.value === currency)?.label ?? 'Select...'}
          </Select.Trigger>
          <Select.Content>
            {#each currencyOptions as option (option.value)}
              <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label class="text-sm font-medium">Time zone</Label>
        <Select.Root type="single" bind:value={timezone}>
          <Select.Trigger class="w-full">
            {timezoneOptions.find(o => o.value === timezone)?.label ?? 'Select...'}
          </Select.Trigger>
          <Select.Content>
            {#each timezoneOptions as option (option.value)}
              <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  </div>

  <div class="mt-8 flex items-center justify-end gap-3">
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
