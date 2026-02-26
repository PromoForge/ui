# Fix Suggestions vs Pick List Values — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate inline suggestions (tag input) from allowed list values (CSV upload) so each uses the correct backend API and flags.

**Architecture:** The tag input sends `suggestions` + `restrictedBySuggestions` via `CreateAttribute`. CSV upload calls `ImportAttributeAllowedList` as a second step after attribute creation. The two modes are mutually exclusive in the UI (CSV clears/disables tag input). The store orchestrates the two-step flow.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, hey-api generated SDK

---

### Task 1: Add `importAttributeAllowedList` to the service layer

**Files:**
- Modify: `src/lib/services/attributeService.ts`

**Step 1: Add the import function**

Add this import at the top of the file alongside the existing SDK imports:

```typescript
import {
  backstageServiceListAttributes,
  backstageServiceCreateAttribute,
  backstageServiceUpdateAttribute,
  backstageServiceDeleteAttribute,
  backstageServiceArchiveAttribute,
  backstageServiceImportAttributeAllowedList,
} from "$lib/api/generated";
```

Add this import to the type imports:

```typescript
import type {
  Attribute,
  CreateAttributeRequest,
  UpdateAttributeRequest,
  ArchiveAttributeRequest,
  ImportAttributeAllowedListResponse,
} from "$lib/api/generated/types.gen";
```

Add this function at the end of the file (before the closing):

```typescript
export async function importAttributeAllowedList(
  attributeId: number,
  csvContent: string,
): Promise<ImportAttributeAllowedListResponse> {
  const { data, error } = await backstageServiceImportAttributeAllowedList({
    path: { attributeId },
    body: { attributeId, csvContent },
  });
  if (error) {
    throw new Error("Failed to import allowed list");
  }
  return data!;
}
```

**Step 2: Verify types compile**

Run: `make check`
Expected: No new type errors

**Step 3: Commit**

```bash
git add src/lib/services/attributeService.ts
git commit -m "feat: add importAttributeAllowedList service function"
```

---

### Task 2: Update the store to support the two-step create flow

**Files:**
- Modify: `src/lib/stores/attributeStore.svelte.ts`

**Step 1: Add the import**

Update the import from `attributeService` at the top:

```typescript
import {
  listAttributes,
  createAttribute as createAttributeApi,
  updateAttribute as updateAttributeApi,
  importAttributeAllowedList as importAllowedListApi,
} from "$lib/services/attributeService";
```

**Step 2: Update the `createAttribute` method**

Replace the existing `createAttribute` function (lines 172-178) with:

```typescript
  async function createAttribute(
    request: CreateAttributeRequest,
    csvContent?: string,
  ): Promise<Attribute> {
    const attr = await createAttributeApi(request);
    attributes = [attr, ...attributes];
    if (csvContent && attr.id) {
      await importAllowedListApi(attr.id, csvContent);
    }
    return attr;
  }
```

**Step 3: Verify types compile**

Run: `make check`
Expected: No new type errors

**Step 4: Commit**

```bash
git add src/lib/stores/attributeStore.svelte.ts
git commit -m "feat: support two-step create with optional CSV import in attribute store"
```

---

### Task 3: Update the page to pass through `csvContent`

**Files:**
- Modify: `src/routes/(app)/settings/tools/attributes/+page.svelte`

**Step 1: Update the `onSubmit` callback**

Change line 131 from:

```svelte
onSubmit={async (req) => { await attributeStore.createAttribute(req) }}
```

to:

```svelte
onSubmit={async (req, csvContent) => { await attributeStore.createAttribute(req, csvContent) }}
```

**Step 2: Verify types compile**

Run: `make check`
Expected: No new type errors

**Step 3: Commit**

```bash
git add src/routes/(app)/settings/tools/attributes/+page.svelte
git commit -m "feat: pass csvContent through to attribute store from page"
```

---

### Task 4: Fix `CreateAttributeSheet` — state, CSV handling, mutual exclusivity

This is the main task. It changes how CSV files are stored (as raw text, not parsed into `suggestions`), enforces mutual exclusivity between tag input and CSV, and fixes the submit flow.

**Files:**
- Modify: `src/lib/components/attributes/CreateAttributeSheet.svelte`

**Step 1: Update the `onSubmit` prop type and add CSV state**

Change the `onSubmit` prop type (line 26) from:

```typescript
onSubmit: (request: CreateAttributeRequest) => Promise<void>
```

to:

```typescript
onSubmit: (request: CreateAttributeRequest, csvContent?: string) => Promise<void>
```

Add a new state variable for storing raw CSV content (after line 48, `datePickerOpen`):

```typescript
let csvContent = $state<string | null>(null)
```

Add a derived boolean to check if CSV mode is active:

```typescript
const hasCsv = $derived(csvContent !== null)
```

**Step 2: Rewrite `handleCsvUpload` to store raw CSV, not parse into suggestions**

Replace the existing `handleCsvUpload` function (lines 105-126) with:

```typescript
  function handleCsvUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    csvFileName = file.name
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      // Store raw CSV — add "item" header if not present
      const lines = text.trim().split(/\r?\n/)
      const hasHeader = lines[0]?.toLowerCase().trim() === 'item'
      csvContent = hasHeader ? text : `item\n${text}`
      // Clear inline suggestions — CSV and tags are mutually exclusive
      suggestions = []
      tagInputValue = ''
    }
    reader.readAsText(file)
    input.value = ''
  }
```

**Step 3: Add a function to remove the uploaded CSV**

Add after `handleCsvUpload`:

```typescript
  function removeCsv() {
    csvContent = null
    csvFileName = ''
  }
```

**Step 4: Update `resetForm` to clear CSV state**

In the `resetForm` function (lines 182-198), add `csvContent = null` alongside the existing `csvFileName = ''` reset:

```typescript
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
    csvContent = null
    selectedAppIds = []
    appDropdownOpen = false
    submitting = false
    attempted = false
    apiNameManuallyEdited = false
    submitError = ''
  }
```

**Step 5: Update the `$effect` for type change to also clear CSV**

Replace the type-change effect (lines 152-159) with:

```typescript
  $effect(() => {
    type;
    suggestions = []
    tagInputValue = ''
    allowCustomValues = false
    csvFileName = ''
    csvContent = null
  })
```

**Step 6: Fix the `handleSubmit` function**

Replace the `handleSubmit` function (lines 205-234) with:

```typescript
  async function handleSubmit() {
    attempted = true
    submitError = ''

    if (!entity || !type || !apiName || !/^[a-zA-Z0-9_]+$/.test(apiName)) {
      return
    }

    submitting = true
    try {
      const subscribedApplicationsIds = selectedAppIds.length > 0 ? selectedAppIds : undefined

      // Build the create request — suggestions and CSV are mutually exclusive
      const request: CreateAttributeRequest = {
        entity: entity as CreateAttributeRequest['entity'],
        type: type as CreateAttributeRequest['type'],
        name: apiName,
        title: name || undefined,
        description: description || undefined,
        subscribedApplicationsIds
      }

      if (hasCsv) {
        // CSV mode: no suggestions, no flags — import endpoint sets hasAllowedList
      } else if (suggestions.length > 0) {
        // Inline suggestions mode
        request.suggestions = suggestions
        request.restrictedBySuggestions = !allowCustomValues
      } else if (showPicklist) {
        // Picklist type but no values entered — send restrictedBySuggestions based on checkbox
        request.restrictedBySuggestions = !allowCustomValues
      }

      // Base64-encode CSV content for the proto bytes field
      const encodedCsv = csvContent ? btoa(csvContent) : undefined

      await onSubmit(request, encodedCsv)
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError = e instanceof Error ? e.message : 'Failed to create attribute'
    } finally {
      submitting = false
    }
  }
```

**Step 7: Verify types compile**

Run: `make check`
Expected: No new type errors

**Step 8: Commit**

```bash
git add src/lib/components/attributes/CreateAttributeSheet.svelte
git commit -m "fix: separate suggestions from allowed list in attribute creation logic"
```

---

### Task 5: Update the template for mutual exclusivity UI

**Files:**
- Modify: `src/lib/components/attributes/CreateAttributeSheet.svelte` (template section)

**Step 1: Conditionally hide "Allow custom values" checkbox when CSV is uploaded**

Replace the checkbox block (lines 406-412) with:

```svelte
          {#if !hasCsv}
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={allowCustomValues}
                onCheckedChange={(v) => (allowCustomValues = !!v)}
              />
              Allow users to enter custom values in the Rule Builder
            </label>
          {/if}
```

**Step 2: Disable tag input when CSV is uploaded**

For the **time type date picker** section (lines 417-441), wrap it in a `{#if !hasCsv}` block:

```svelte
          <div class="space-y-1.5">
            <Label class="text-sm font-medium">Values</Label>

            {#if hasCsv}
              <!-- CSV uploaded — tag input disabled -->
              <div class="rounded-md border border-input bg-muted/50 px-3 py-2 min-h-[40px]">
                <p class="text-sm text-muted-foreground">Values will be imported from CSV file.</p>
              </div>
            {:else if isTimeType}
```

Keep the existing time type and text tag input blocks as-is (they already have `{:else}` between them), then close appropriately.

The full replacement for the Values section (lines 414-471) becomes:

```svelte
          <div class="space-y-1.5">
            <Label class="text-sm font-medium">Values</Label>

            {#if hasCsv}
              <div class="rounded-md border border-input bg-muted/50 px-3 py-2 min-h-[40px]">
                <p class="text-sm text-muted-foreground">Values will be imported from CSV file.</p>
              </div>
            {:else if isTimeType}
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

            {#if suggestions.length > 0 && !hasCsv}
              <p class="text-xs text-muted-foreground">{suggestions.length} / 50 values</p>
            {/if}
          </div>
```

**Step 3: Update CSV upload section to show filename + remove button when CSV is uploaded**

Replace the CSV upload section (lines 474-496) with:

```svelte
          <!-- CSV Upload -->
          <div class="space-y-2 pt-1">
            {#if hasCsv}
              <div class="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                <Upload size={14} class="shrink-0 text-muted-foreground" />
                <span class="flex-1 truncate">{csvFileName}</span>
                <button
                  class="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  onclick={removeCsv}
                >
                  <X size={14} />
                </button>
              </div>
            {:else}
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
            {/if}
          </div>
```

**Step 4: Verify types compile**

Run: `make check`
Expected: No new type errors

**Step 5: Commit**

```bash
git add src/lib/components/attributes/CreateAttributeSheet.svelte
git commit -m "fix: enforce mutual exclusivity between suggestions and CSV upload in UI"
```

---

### Task 6: Manual verification

**Step 1: Start dev server**

Run: `make dev`

**Step 2: Test inline suggestions flow**

1. Navigate to Settings > Tools > Attributes
2. Click "Create Attribute"
3. Select Entity: "Application", Type: "String"
4. Add tags via the tag input: "value1", "value2"
5. Verify the "Allow custom values" checkbox is visible
6. Submit and verify the request in browser DevTools Network tab contains:
   - `suggestions: ["value1", "value2"]`
   - `restrictedBySuggestions: true` (checkbox unchecked)
   - NO `hasAllowedList` field

**Step 3: Test CSV upload flow**

1. Create another attribute with Type: "String"
2. Add some tags, then upload a CSV
3. Verify: tags are cleared, tag input shows "Values will be imported from CSV file.", checkbox is hidden
4. Verify: CSV filename shows with X button to remove
5. Submit and verify in DevTools:
   - First request to create attribute has NO `suggestions` or `hasAllowedList`
   - Second request to `/api/v1/attributes/{id}/allowed_list/import` with `csvContent` (base64)

**Step 4: Test CSV removal**

1. Upload a CSV, then click the X button to remove it
2. Verify: tag input is re-enabled, checkbox reappears

**Step 5: Test type change clears state**

1. Add tags and/or upload CSV
2. Change the type
3. Verify: all picklist state is cleared (tags, CSV, checkbox)
