# Applications API Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect the application list page to real APIs, add a create application slide-in form, and establish reusable form components.

**Architecture:** Replace mock data in applicationService with hey-api SDK calls. Build reusable SlidePanel, Select, Textarea, and FormField components. Wire a CreateApplicationForm into the existing ApplicationPanel. Drop local Application type in favor of SDK-generated types.

**Tech Stack:** hey-api SDK (generated), SvelteKit 2, Svelte 5 runes, Tailwind CSS v4

---

### Task 1: Create form UI primitives

**Files:**
- Create: `src/lib/components/ui/Select.svelte`
- Create: `src/lib/components/ui/Textarea.svelte`
- Create: `src/lib/components/ui/FormField.svelte`

**Step 1: Create Select component**

`src/lib/components/ui/Select.svelte`:

```svelte
<script lang="ts">
  let {
    value = $bindable(''),
    options = [],
    class: className = ''
  }: {
    value?: string
    options?: { value: string; label: string }[]
    class?: string
  } = $props()
</script>

<select
  bind:value
  class="w-full appearance-none rounded-lg bg-gray-100 px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/20 {className}"
>
  {#each options as option (option.value)}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
```

**Step 2: Create Textarea component**

`src/lib/components/ui/Textarea.svelte`:

```svelte
<script lang="ts">
  let {
    placeholder = '',
    value = $bindable(''),
    rows = 3,
    class: className = ''
  }: {
    placeholder?: string
    value?: string
    rows?: number
    class?: string
  } = $props()
</script>

<textarea
  {placeholder}
  bind:value
  {rows}
  class="w-full resize-none rounded-lg bg-gray-100 px-3 py-2 text-sm text-ink placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/20 {className}"
></textarea>
```

**Step 3: Create FormField component**

`src/lib/components/ui/FormField.svelte`:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    label,
    required = false,
    children
  }: {
    label: string
    required?: boolean
    children: Snippet
  } = $props()
</script>

<div class="flex flex-col gap-1.5">
  <label class="text-sm font-medium text-ink">
    {label}{#if !required}<span class="font-normal text-gray-400"> (optional)</span>{/if}
  </label>
  {@render children()}
</div>
```

**Step 4: Commit**

```bash
git add src/lib/components/ui/Select.svelte src/lib/components/ui/Textarea.svelte src/lib/components/ui/FormField.svelte
git commit -m "feat: add Select, Textarea, and FormField UI primitives"
```

---

### Task 2: Create SlidePanel component and add disabled prop to Button

**Files:**
- Create: `src/lib/components/ui/SlidePanel.svelte`
- Modify: `src/lib/components/ui/Button.svelte`

**Step 1: Add disabled prop to Button**

In `src/lib/components/ui/Button.svelte`, update the props to include `disabled`:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    onclick,
    children,
    class: className = ''
  }: {
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md'
    disabled?: boolean
    onclick?: () => void
    children: Snippet
    class?: string
  } = $props()

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors rounded-full'

  const variantClasses: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-gray-100 text-ink hover:bg-gray-200',
    ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
  }

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm'
  }
</script>

<button
  class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
  {disabled}
  class:opacity-50={disabled}
  class:cursor-not-allowed={disabled}
  onclick={disabled ? undefined : onclick}
>
  {@render children()}
</button>
```

**Step 2: Create SlidePanel component**

`src/lib/components/ui/SlidePanel.svelte`:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte'
  import Button from './Button.svelte'

  let {
    open = $bindable(false),
    title = '',
    submitLabel = 'Submit',
    onsubmit,
    loading = false,
    children
  }: {
    open?: boolean
    title?: string
    submitLabel?: string
    onsubmit?: () => void
    loading?: boolean
    children: Snippet
  } = $props()

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex justify-end"
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-label={title}
    tabindex="-1"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/40 transition-opacity"
      onclick={() => (open = false)}
      role="presentation"
    ></div>

    <!-- Panel -->
    <div class="relative flex w-full max-w-md flex-col bg-white shadow-xl">
      <!-- Header -->
      <div class="border-b border-border px-6 py-4">
        <h2 class="text-lg font-semibold text-ink">{title}</h2>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-6 py-6">
        {@render children()}
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
        <Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
        <Button variant="primary" onclick={onsubmit} disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </div>
  </div>
{/if}
```

**Step 3: Verify type check**

Run:
```bash
make check
```

Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/lib/components/ui/SlidePanel.svelte src/lib/components/ui/Button.svelte
git commit -m "feat: add SlidePanel component and Button disabled prop"
```

---

### Task 3: Migrate applicationService to SDK calls

**Files:**
- Modify: `src/lib/services/applicationService.ts`

**Step 1: Check SDK function signatures**

Before rewriting the service, verify the SDK functions exist and understand their response shapes:

Run:
```bash
grep -n "export const backstageServiceListApplications\b" src/lib/api/generated/sdk.gen.ts
grep -n "export const backstageServiceGetApplication\b" src/lib/api/generated/sdk.gen.ts
grep -n "export const backstageServiceCreateApplication\b" src/lib/api/generated/sdk.gen.ts
```

Also verify response types:
```bash
grep -A5 "export type GetApplicationResponse " src/lib/api/generated/types.gen.ts
grep -A5 "export type ListApplicationsResponse " src/lib/api/generated/types.gen.ts
grep -A5 "export type CreateApplicationResponse " src/lib/api/generated/types.gen.ts
```

**Step 2: Rewrite applicationService.ts**

Replace entire contents of `src/lib/services/applicationService.ts`:

```ts
import {
  backstageServiceListApplications,
  backstageServiceGetApplication,
  backstageServiceCreateApplication
} from '$lib/api/generated'
import type { Application, CreateApplicationRequest } from '$lib/api/generated/types.gen'

export async function getApplications(): Promise<Application[]> {
  const { data, error } = await backstageServiceListApplications()
  if (error) {
    throw new Error('Failed to load applications')
  }
  return data?.data ?? []
}

export async function getApplication(id: number): Promise<Application | undefined> {
  const { data, error } = await backstageServiceGetApplication({
    path: { applicationId: id }
  })
  if (error) {
    throw new Error('Failed to load application')
  }
  return data?.application
}

export async function createApplication(
  request: CreateApplicationRequest
): Promise<Application> {
  const { data, error } = await backstageServiceCreateApplication({
    body: request
  })
  if (error) {
    throw new Error('Failed to create application')
  }
  return data!.application!
}
```

Note: The SDK functions return `{ data, error }`. The `data` field is the typed response body. Check the actual response type names in step 1 — if `GetApplicationResponse` wraps differently, adjust the field access.

**Step 3: Verify type check**

Run:
```bash
make check
```

Expected: Errors in `applicationStore.svelte.ts` and `ApplicationCard.svelte` due to type changes (the local `Application` type is gone from the service). These are expected and fixed in the next tasks.

**Step 4: Commit**

```bash
git add src/lib/services/applicationService.ts
git commit -m "feat: connect applicationService to real API via SDK"
```

---

### Task 4: Update applicationStore and ApplicationCard for SDK types

**Files:**
- Modify: `src/lib/stores/applicationStore.svelte.ts`
- Modify: `src/lib/components/dashboard/ApplicationCard.svelte`

**Step 1: Find all files importing Application from local types**

Run:
```bash
grep -rn "from '\$lib/types'" src/lib/stores/applicationStore.svelte.ts src/lib/components/dashboard/ApplicationCard.svelte src/lib/mocks/applications.ts
```

**Step 2: Update applicationStore.svelte.ts**

Key changes:
- Import `Application` from SDK types instead of local types
- `id` is now `number | undefined` instead of `string`
- `selectedId` stays `string | null` (route params are strings)
- Compare using `String(app.id)`
- Null-safe access on `name` for filtering

Replace entire contents:

```ts
import { getApplications } from '$lib/services/applicationService'
import type { Application } from '$lib/api/generated/types.gen'

function createApplicationStore() {
  let applications = $state<Application[]>([])
  let selectedId = $state<string | null>(null)
  let searchQuery = $state('')
  let loading = $state(false)

  const selectedApplication = $derived(
    applications.find((a) => String(a.id) === selectedId) ?? null
  )

  const filteredApplications = $derived(
    searchQuery
      ? applications.filter((a) =>
          (a.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : applications
  )

  async function loadApplications() {
    loading = true
    try {
      applications = await getApplications()
      if (applications.length > 0 && !selectedId) {
        selectedId = String(applications[0].id)
      }
    } finally {
      loading = false
    }
  }

  function selectApplication(id: string) {
    selectedId = id
  }

  function setSearchQuery(query: string) {
    searchQuery = query
  }

  return {
    get applications() {
      return applications
    },
    get selectedId() {
      return selectedId
    },
    get selectedApplication() {
      return selectedApplication
    },
    get filteredApplications() {
      return filteredApplications
    },
    get searchQuery() {
      return searchQuery
    },
    get loading() {
      return loading
    },
    loadApplications,
    selectApplication,
    setSearchQuery
  }
}

export const applicationStore = createApplicationStore()
```

**Step 3: Update ApplicationCard.svelte**

The SDK `Application` type doesn't have `campaignCount`, `runningCount`, `disabledCount`, `expiredCount`. Adapt the card to show what the API provides: environment badge, name, and description. Campaign stats can be re-added later with a health/stats endpoint.

Replace entire contents of `src/lib/components/dashboard/ApplicationCard.svelte`:

```svelte
<script lang="ts">
  import type { Application } from '$lib/api/generated/types.gen'
  import Badge from '$lib/components/ui/Badge.svelte'

  let {
    application,
    selected = false,
    href,
    onclick
  }: {
    application: Application
    selected?: boolean
    href?: string
    onclick?: () => void
  } = $props()

  const isLive = $derived(application.environment === 'APPLICATION_ENVIRONMENT_LIVE')
</script>

<a
  {href}
  class="group block w-full cursor-pointer rounded-lg bg-panel p-4 text-left shadow-card transition-all hover:shadow-md {selected
    ? 'border-l-2 border-primary bg-blue-50/50'
    : 'border-l-2 border-transparent'}"
  onclick={onclick}
>
  <!-- Top row: badge -->
  <div class="flex items-start justify-between">
    <Badge variant={isLive ? 'live' : 'sandbox'} label={isLive ? 'LIVE' : 'SANDBOX'} />
  </div>

  <!-- App name -->
  <h3 class="mt-2 text-base font-bold text-ink">{application.name}</h3>

  <!-- Description -->
  {#if application.description}
    <p class="mt-1 text-xs text-gray-500 line-clamp-2">{application.description}</p>
  {/if}
</a>
```

**Step 4: Check for other files importing the local Application type**

Run:
```bash
grep -rn "from '\$lib/types'" src/ --include="*.svelte" --include="*.ts" | grep -i application
```

Fix any remaining imports — they should import from `$lib/api/generated/types.gen` instead. Common places: other stores (`appDetailStore`, `dashboardStore`), other components, other services.

For each file found, change:
```ts
// Old
import type { Application } from '$lib/types'
// New
import type { Application } from '$lib/api/generated/types.gen'
```

And update any field access (e.g., `app.id` is now `number`, `app.environment` is now the SDK enum string).

**Step 5: Update ApplicationPanel.svelte**

In `src/lib/components/layout/ApplicationPanel.svelte`, update the href to use `String(app.id)`:

Find:
```svelte
href="/applications/{app.id}"
onclick={() => applicationStore.selectApplication(app.id)}
```

Replace with:
```svelte
href="/applications/{app.id}"
onclick={() => applicationStore.selectApplication(String(app.id))}
```

**Step 6: Verify type check**

Run:
```bash
make check
```

Fix any remaining type errors. Common issues:
- `app.id` used as string somewhere → wrap with `String()`
- `app.name` used without null check → use `app.name ?? ''`
- `app.campaignCount` referenced → remove or make optional

**Step 7: Commit**

```bash
git add src/lib/stores/applicationStore.svelte.ts src/lib/components/dashboard/ApplicationCard.svelte src/lib/components/layout/ApplicationPanel.svelte
git add -u  # catch any other modified files from step 4
git commit -m "feat: migrate application types to SDK and update store/components"
```

---

### Task 5: Create CreateApplicationForm and wire into ApplicationPanel

**Files:**
- Create: `src/lib/components/applications/CreateApplicationForm.svelte`
- Modify: `src/lib/components/layout/ApplicationPanel.svelte`

**Step 1: Create the form component**

`src/lib/components/applications/CreateApplicationForm.svelte`:

```svelte
<script lang="ts">
  import { createApplication } from '$lib/services/applicationService'
  import { applicationStore } from '$lib/stores/applicationStore.svelte'
  import type { CreateApplicationRequest } from '$lib/api/generated/types.gen'
  import FormField from '$lib/components/ui/FormField.svelte'
  import Input from '$lib/components/ui/Input.svelte'
  import Textarea from '$lib/components/ui/Textarea.svelte'
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

    <FormField label="Name" required>
      <Input placeholder="Application name" bind:value={name} />
    </FormField>

    <FormField label="Description">
      <Textarea placeholder="Describe this application" bind:value={description} />
    </FormField>

    <FormField label="Currency" required>
      <Select bind:value={currency} options={currencyOptions} />
    </FormField>

    <FormField label="Time zone" required>
      <Select bind:value={timezone} options={timezoneOptions} />
    </FormField>

    <FormField label="Code case sensitivity" required>
      <Select bind:value={caseSensitivity} options={caseSensitivityOptions} />
    </FormField>

    <FormField label="Application environment" required>
      <Select bind:value={environment} options={environmentOptions} />
    </FormField>
  </div>
</SlidePanel>
```

**Step 2: Wire into ApplicationPanel**

In `src/lib/components/layout/ApplicationPanel.svelte`:

Add import at top of `<script>`:
```ts
import CreateApplicationForm from '$lib/components/applications/CreateApplicationForm.svelte'
```

Add state:
```ts
let showCreateForm = $state(false)
```

Replace the create button:
```svelte
<!-- Old -->
<Button variant="primary" size="sm">+ Create</Button>

<!-- New -->
<Button variant="primary" size="sm" onclick={() => (showCreateForm = true)}>+ Create</Button>
```

Add the form component at the bottom of the template (before the closing `</div>`):
```svelte
<CreateApplicationForm bind:open={showCreateForm} />
```

**Step 3: Verify type check**

Run:
```bash
make check
```

Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/lib/components/applications/CreateApplicationForm.svelte src/lib/components/layout/ApplicationPanel.svelte
git commit -m "feat: add create application form with slide-in panel"
```

---

### Task 6: Clean up old types and mocks, verify build

**Files:**
- Modify: `src/lib/types/application.ts`
- Modify: `src/lib/types/index.ts`
- Modify: `src/lib/mocks/applications.ts`

**Step 1: Check what else imports from application.ts**

Run:
```bash
grep -rn "Environment" src/ --include="*.svelte" --include="*.ts" | grep -v node_modules | grep -v generated
```

If `Environment` type is used elsewhere, keep it or migrate those usages.

**Step 2: Remove local Application type**

In `src/lib/types/application.ts`, remove the `Application` interface and `Environment` type. If nothing else uses this file, delete it entirely and remove the re-export from `src/lib/types/index.ts`.

If other files still import `Environment`, update them to use the SDK enum string directly.

**Step 3: Update or remove mock applications**

`src/lib/mocks/applications.ts` imports the local `Application` type. Since the service no longer uses mock data, this file can be deleted. But check first if anything else imports it:

Run:
```bash
grep -rn "mocks/applications" src/
```

If only `applicationService.ts` imported it (and that's been updated), delete the file.

**Step 4: Verify type check**

Run:
```bash
make check
```

Expected: 0 errors, 0 warnings.

**Step 5: Start dev server**

Run:
```bash
make dev
```

Expected: Dev server starts. Navigate to the application list page — it should attempt to fetch from the real API. If the API is not running, you'll see the error handling (empty list). The "+ Create" button should open the slide-in panel.

**Step 6: Commit**

```bash
git add -u
git commit -m "chore: remove local Application type and mock data"
```
