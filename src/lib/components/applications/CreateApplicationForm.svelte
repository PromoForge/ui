<script lang="ts">
  import { createApplication } from '$lib/services/applicationService'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import type { CreateApplicationRequest } from '$lib/api/generated/types.gen'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import Select from '$lib/components/ui/Select.svelte'
  import SlidePanel from '$lib/components/ui/SlidePanel.svelte'

  let {
    open = $bindable(false)
  }: {
    open?: boolean
  } = $props()

  let name = $state('')
  let description = $state('')
  let currency = $state('SAR')
  let timezone = $state('Asia/Riyadh')
  let caseSensitivity = $state('CASE_SENSITIVITY_INSENSITIVE_UPPERCASE')
  let environment = $state('APPLICATION_ENVIRONMENT_SANDBOX')
  let loading = $state(false)
  let error = $state('')

  const currencyOptions = [
    { value: 'SAR', label: 'Saudi Riyal – SAR' },
    { value: 'AED', label: 'UAE Dirham – AED' },
    { value: 'USD', label: 'US Dollar – USD' },
    { value: 'EUR', label: 'Euro – EUR' },
    { value: 'GBP', label: 'British Pound – GBP' },
    { value: 'EGP', label: 'Egyptian Pound – EGP' },
    { value: 'KWD', label: 'Kuwaiti Dinar – KWD' },
    { value: 'BHD', label: 'Bahraini Dinar – BHD' },
    { value: 'QAR', label: 'Qatari Riyal – QAR' },
    { value: 'OMR', label: 'Omani Rial – OMR' }
  ]

  const timezoneOptions = [
    { value: 'Asia/Riyadh', label: 'Asia/Riyadh' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai' },
    { value: 'Asia/Kuwait', label: 'Asia/Kuwait' },
    { value: 'Africa/Cairo', label: 'Africa/Cairo' },
    { value: 'Europe/London', label: 'Europe/London' },
    { value: 'America/New_York', label: 'America/New_York' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
    { value: 'UTC', label: 'UTC' }
  ]

  const caseSensitivityOptions = [
    {
      value: 'CASE_SENSITIVITY_INSENSITIVE_UPPERCASE',
      label: 'Case insensitive – Uppercase (recommended)'
    },
    {
      value: 'CASE_SENSITIVITY_INSENSITIVE_LOWERCASE',
      label: 'Case insensitive – Lowercase'
    },
    { value: 'CASE_SENSITIVITY_SENSITIVE', label: 'Case sensitive' }
  ]

  const environmentOptions = [
    { value: 'APPLICATION_ENVIRONMENT_SANDBOX', label: 'Sandbox' },
    { value: 'APPLICATION_ENVIRONMENT_LIVE', label: 'Live' }
  ]

  function resetForm() {
    name = ''
    description = ''
    currency = 'SAR'
    timezone = 'Asia/Riyadh'
    caseSensitivity = 'CASE_SENSITIVITY_INSENSITIVE_UPPERCASE'
    environment = 'APPLICATION_ENVIRONMENT_SANDBOX'
    error = ''
  }

  async function handleSubmit() {
    if (!name.trim()) {
      error = 'Name is required'
      return
    }

    loading = true
    error = ''
    try {
      const request: CreateApplicationRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        currency,
        timezone,
        caseSensitivity: caseSensitivity as CreateApplicationRequest['caseSensitivity'],
        environment: environment as CreateApplicationRequest['environment']
      }
      await createApplication(request)
      await applicationStore.loadApplications()
      resetForm()
      open = false
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create application'
    } finally {
      loading = false
    }
  }
</script>

<SlidePanel
  bind:open
  title="Create an Application"
  submitLabel="Create Application"
  onsubmit={handleSubmit}
  {loading}
>
  <div class="flex flex-col gap-5">
    {#if error}
      <div class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
    {/if}

    <div class="flex flex-col gap-1.5">
      <Label class="text-sm font-medium">Name</Label>
      <Input placeholder="Application name" bind:value={name} />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="text-sm font-medium">
        Description <span class="font-normal text-muted-foreground">(optional)</span>
      </Label>
      <Textarea placeholder="Describe this application" bind:value={description} />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="text-sm font-medium">Currency</Label>
      <Select bind:value={currency} options={currencyOptions} />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="text-sm font-medium">Time zone</Label>
      <Select bind:value={timezone} options={timezoneOptions} />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="text-sm font-medium">Code case sensitivity</Label>
      <Select bind:value={caseSensitivity} options={caseSensitivityOptions} />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label class="text-sm font-medium">Application environment</Label>
      <Select bind:value={environment} options={environmentOptions} />
    </div>
  </div>
</SlidePanel>
