# Edit Application Settings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the edit application flow — pencil icon on ApplicationCard navigates to a settings page where users edit name, description, currency, and timezone.

**Architecture:** Replace the `settings-app/+page.svelte` stub with a two-column settings layout (left sub-nav + right content). The "Details" sub-tab renders a form backed by `applicationStore` and the `backstageServiceUpdateApplication` API. The ApplicationPanel wires the edit button to navigate.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, shadcn-svelte (Select, Input, Textarea, Button, Label, Separator, Alert, Breadcrumb), hey-api generated SDK

---

### Task 1: Add `updateApplication` to the service layer

**Files:**
- Modify: `src/lib/services/applicationService.ts`

**Step 1: Add the update function**

Add this import and function to `src/lib/services/applicationService.ts`:

```typescript
// Add to existing imports:
import {
  backstageServiceListApplications,
  backstageServiceGetApplication,
  backstageServiceCreateApplication,
  backstageServiceUpdateApplication
} from '$lib/api/generated'
import type { Application, CreateApplicationRequest, UpdateApplicationRequest } from '$lib/api/generated/types.gen'

// Add this function after createApplication:
export async function updateApplication(
  applicationId: number,
  request: UpdateApplicationRequest
): Promise<Application> {
  const { data, error } = await backstageServiceUpdateApplication({
    path: { applicationId },
    body: request
  })
  if (error) {
    throw new Error('Failed to update application')
  }
  return data!.application!
}
```

**Step 2: Commit**

```bash
git add src/lib/services/applicationService.ts
git commit -m "feat: add updateApplication to service layer"
```

---

### Task 2: Add `updateApplication` to the store

**Files:**
- Modify: `src/lib/stores/applicationStore.svelte.ts`

**Step 1: Add the update method**

Import `updateApplication` from the service and add a method to the store that calls it and updates the local `applications` array in place:

```typescript
// Add to imports:
import { getApplications, updateApplication as updateApplicationApi } from '$lib/services/applicationService'
import type { Application, UpdateApplicationRequest } from '$lib/api/generated/types.gen'

// Add inside createApplicationStore(), before the return:
async function updateApplication(id: number, request: UpdateApplicationRequest): Promise<void> {
  const updated = await updateApplicationApi(id, request)
  applications = applications.map((a) => (a.id === updated.id ? updated : a))
}

// Add to the return object:
// updateApplication,
```

**Step 2: Commit**

```bash
git add src/lib/stores/applicationStore.svelte.ts
git commit -m "feat: add updateApplication to applicationStore"
```

---

### Task 3: Create the ApplicationDetailsForm component

**Files:**
- Create: `src/lib/components/settings/ApplicationDetailsForm.svelte`

**Step 1: Create the form component**

This component receives the current application, clones its values into local state, tracks dirty state, and calls the store update on save.

```svelte
<script lang="ts">
  import type { Application } from '$lib/api/generated/types.gen'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
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
```

**Step 2: Commit**

```bash
git add src/lib/components/settings/ApplicationDetailsForm.svelte
git commit -m "feat: add ApplicationDetailsForm component"
```

---

### Task 4: Replace the settings-app page stub

**Files:**
- Modify: `src/routes/applications/[id]/settings-app/+page.svelte`

**Step 1: Replace the stub with the settings layout**

Replace the entire contents of `settings-app/+page.svelte` with a two-column layout: left sidebar with sub-tab navigation, right content area rendering ApplicationDetailsForm.

```svelte
<script lang="ts">
  import { page } from '$app/state'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import Breadcrumb from '$lib/components/ui/app-breadcrumb.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import ApplicationDetailsForm from '$lib/components/settings/ApplicationDetailsForm.svelte'

  const appId = $derived(page.params.id)
  const app = $derived(applicationStore.selectedApplication)
  const appName = $derived(app?.name ?? 'Application')

  const breadcrumbItems = $derived([
    { label: 'Apps', href: '/' },
    { label: appName, href: `/applications/${appId}` },
    { label: 'Settings' }
  ])

  // Sub-tab nav — only "Details" active for now
  type SettingsTab = 'details'
  let activeTab = $state<SettingsTab>('details')

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'details', label: 'Details' }
  ]
</script>

<div class="p-6">
  <Breadcrumb items={breadcrumbItems} />

  <div class="mt-6 flex gap-8">
    <!-- Left sub-nav -->
    <nav class="flex w-48 shrink-0 flex-col gap-1">
      {#each tabs as tab (tab.id)}
        <Button
          variant={activeTab === tab.id ? 'secondary' : 'ghost'}
          class="justify-start"
          onclick={() => (activeTab = tab.id)}
        >
          {tab.label}
        </Button>
      {/each}
    </nav>

    <Separator orientation="vertical" class="h-auto" />

    <!-- Right content -->
    <div class="flex-1">
      {#if activeTab === 'details' && app}
        <ApplicationDetailsForm application={app} />
      {/if}
    </div>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add src/routes/applications/[id]/settings-app/+page.svelte
git commit -m "feat: replace settings-app stub with details form layout"
```

---

### Task 5: Wire the edit button in ApplicationPanel

**Files:**
- Modify: `src/lib/components/layout/ApplicationPanel.svelte`

**Step 1: Add `goto` import and pass `onedit`**

In `ApplicationPanel.svelte`, add the `goto` import (already imported in file — check), then pass `onedit` to each `ApplicationCard`:

```svelte
<!-- Change the ApplicationCard usage from: -->
<ApplicationCard
  application={app}
  selected={selectedAppId === String(app.id)}
  href="/applications/{app.id}"
  onclick={() => applicationStore.selectApplication(String(app.id))}
/>

<!-- To: -->
<ApplicationCard
  application={app}
  selected={selectedAppId === String(app.id)}
  href="/applications/{app.id}"
  onclick={() => applicationStore.selectApplication(String(app.id))}
  onedit={() => goto(`/applications/${app.id}/settings-app`)}
/>
```

Also add `import { goto } from '$app/navigation'` at the top if not already present.

**Step 2: Commit**

```bash
git add src/lib/components/layout/ApplicationPanel.svelte
git commit -m "feat: wire edit button to navigate to settings page"
```

---

### Task 6: Verify the full flow

**Step 1: Run type check**

```bash
make check
```

Expected: No errors.

**Step 2: Run dev server and manually verify**

```bash
make dev
```

Verify:
1. Click pencil icon on an ApplicationCard → navigates to `/applications/{id}/settings-app`
2. Settings page shows breadcrumb, left nav with "Details" active, form on right
3. Form is pre-populated with current application values
4. Changing a field enables "Save Changes" button
5. Clicking "Cancel" resets form
6. Clicking "Save Changes" calls API, shows success state, button returns to "No Changes"
7. Clicking "Settings" in the sidebar also navigates to the same page

**Step 3: Commit any fixes, then final commit**

```bash
git add -A
git commit -m "feat: edit application settings details page"
```
