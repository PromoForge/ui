# Attribute Edit & Delete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add edit and delete functionality for custom attributes via a dual-mode sheet and delete confirmation dialog.

**Architecture:** Refactor `CreateAttributeSheet` into `AttributeSheet` with `mode: 'create' | 'edit'`. Add pen icon on table row hover. Delete uses shadcn Dialog over the open sheet. Store gains `editSheetOpen`, `editingAttribute`, `updateAttribute`, and `deleteAttribute`.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, shadcn-svelte (Sheet, Dialog, Separator), lucide-svelte, Playwright E2E

---

### Task 1: Add store methods for update and delete

**Files:**
- Modify: `src/lib/stores/attributeStore.svelte.ts`

**Step 1: Add new state and methods to the store**

Add `editSheetOpen`, `editingAttribute`, and the four new methods inside `createAttributeStore()`:

```ts
// After existing state declarations (line ~57, after createSheetOpen)
let editSheetOpen = $state(false)
let editingAttribute = $state<Attribute | null>(null)
```

Add these methods after the existing `toggleVisibility` method:

```ts
function openEditSheet(attribute: Attribute) {
  editingAttribute = attribute
  editSheetOpen = true
}

function closeEditSheet() {
  editSheetOpen = false
  editingAttribute = null
}

async function updateAttributeData(
  id: number,
  request: Omit<import('$lib/api/generated/types.gen').UpdateAttributeRequest, 'attributeId'>,
  csvContent?: string
): Promise<void> {
  const updated = await updateAttributeApi(id, request)
  attributes = attributes.map((a) => (a.id === updated.id ? updated : a))
  if (csvContent && id) {
    await importAllowedListApi(id, csvContent)
  }
}

async function removeAttribute(id: number): Promise<void> {
  await deleteAttributeApi(id)
  attributes = attributes.filter((a) => a.id !== id)
}
```

Add import for `deleteAttribute` service at the top of the file:

```ts
import {
  listAttributes,
  createAttribute as createAttributeApi,
  updateAttribute as updateAttributeApi,
  deleteAttribute as deleteAttributeApi,
  importAttributeAllowedList as importAllowedListApi,
} from "$lib/services/attributeService";
```

Also import the `UpdateAttributeRequest` type:

```ts
import type {
  Attribute,
  CreateAttributeRequest,
  UpdateAttributeRequest,
} from "$lib/api/generated/types.gen";
```

Expose the new state and methods in the return object:

```ts
get editSheetOpen() { return editSheetOpen },
set editSheetOpen(v: boolean) { editSheetOpen = v },
get editingAttribute() { return editingAttribute },
openEditSheet,
closeEditSheet,
updateAttributeData,
removeAttribute,
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors related to the store changes.

**Step 3: Commit**

```bash
git add src/lib/stores/attributeStore.svelte.ts
git commit -m "feat: add edit/delete state and methods to attribute store"
```

---

### Task 2: Add pen icon on hover to AttributeTable

**Files:**
- Modify: `src/lib/components/attributes/AttributeTable.svelte`

**Step 1: Add the edit callback prop and pen icon**

Add `Pencil` to imports and an `onEdit` callback prop:

```ts
import { Pencil } from 'lucide-svelte'

let {
  attributes,
  onEdit
}: {
  attributes: Attribute[]
  onEdit?: (attribute: Attribute) => void
} = $props()
```

Change the table row to use `group` class for hover detection:

```svelte
<Table.Row class="group hover:bg-muted/50">
```

Add the pen icon right after the attribute badge span, inside the same `<Table.Cell>`:

```svelte
<Table.Cell>
  <div class="flex items-center gap-2">
    <span class="inline-block rounded px-2.5 py-1 text-xs font-medium text-white {getBadgeColor(attr.title ?? attr.name ?? '')}">
      {attr.title ?? attr.name ?? '—'}
    </span>
    {#if onEdit && !attr.isBuiltin}
      <button
        class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted cursor-pointer"
        onclick={() => onEdit(attr)}
        aria-label="Edit {attr.title ?? attr.name}"
      >
        <Pencil size={14} class="text-muted-foreground" />
      </button>
    {/if}
  </div>
</Table.Cell>
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/components/attributes/AttributeTable.svelte
git commit -m "feat: add pen icon on hover for custom attribute rows"
```

---

### Task 3: Refactor CreateAttributeSheet into dual-mode AttributeSheet

**Files:**
- Rename: `src/lib/components/attributes/CreateAttributeSheet.svelte` → `src/lib/components/attributes/AttributeSheet.svelte`
- Modify: the renamed file

This is the largest task. The component gains a `mode` prop and conditionally renders read-only fields or editable fields, plus a delete danger zone.

**Step 1: Rename the file**

```bash
cd /Users/ahmedsermani/Desktop/work-repos/PromoForge/ui
git mv src/lib/components/attributes/CreateAttributeSheet.svelte src/lib/components/attributes/AttributeSheet.svelte
```

**Step 2: Update the component props**

Replace the existing props block with:

```ts
import type { Application, Attribute, CreateAttributeRequest, UpdateAttributeRequest } from '$lib/api/generated/types.gen'
import { Separator } from '$lib/components/ui/separator/index.js'
import * as Dialog from '$lib/components/ui/dialog/index.js'

let {
  mode = 'create',
  attribute = undefined,
  open = false,
  onOpenChange,
  onSubmit,
  onUpdate,
  onDelete,
  applications = []
}: {
  mode?: 'create' | 'edit'
  attribute?: Attribute
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (request: CreateAttributeRequest, csvContent?: string) => Promise<void>
  onUpdate?: (request: Omit<UpdateAttributeRequest, 'attributeId'>, csvContent?: string) => Promise<void>
  onDelete?: (attributeId: number) => Promise<void>
  applications: Application[]
} = $props()
```

**Step 3: Add delete dialog state**

After the existing form state declarations:

```ts
let deleteDialogOpen = $state(false)
let deleting = $state(false)
let deleteError = $state('')
```

**Step 4: Add edit mode form initialization effect**

Add this effect after the existing effects (after the auto-slug effect). This pre-populates form fields when opening in edit mode:

```ts
// Pre-populate form in edit mode
$effect(() => {
  if (mode === 'edit' && attribute && open) {
    entity = attribute.entity ?? ''
    type = attribute.type ?? ''
    apiName = attribute.name ?? ''
    name = attribute.title ?? ''
    description = attribute.description ?? ''
    suggestions = attribute.suggestions ? [...attribute.suggestions] : []
    allowCustomValues = !(attribute.restrictedBySuggestions ?? true)
    selectedAppIds = attribute.subscribedApplicationsIds ? [...attribute.subscribedApplicationsIds] : []
    apiNameManuallyEdited = true // prevent auto-slug in edit mode
  }
})
```

**Step 5: Guard the type-clearing effect to create mode only**

Change the existing type-clearing effect from:

```ts
$effect(() => {
  type;
  suggestions = []
  tagInputValue = ''
  allowCustomValues = false
  csvFileName = ''
  csvContent = null
})
```

To:

```ts
// Clear picklist when type changes (create mode only)
let prevType = $state('')
$effect(() => {
  if (mode === 'create' && type !== prevType && prevType !== '') {
    suggestions = []
    tagInputValue = ''
    allowCustomValues = false
    csvFileName = ''
    csvContent = null
  }
  prevType = type
})
```

**Step 6: Update handleSubmit to handle both modes**

Replace the `handleSubmit` function:

```ts
async function handleSubmit() {
  attempted = true
  submitError = ''

  if (mode === 'create') {
    if (!entity || !type || !apiName || !/^[a-zA-Z0-9_]+$/.test(apiName)) {
      return
    }

    submitting = true
    try {
      const subscribedApplicationsIds = selectedAppIds.length > 0 ? selectedAppIds : undefined

      const request: CreateAttributeRequest = {
        entity: entity as CreateAttributeRequest['entity'],
        type: type as CreateAttributeRequest['type'],
        name: apiName,
        title: name || undefined,
        description: description || undefined,
        subscribedApplicationsIds
      }

      if (hasCsv) {
        // CSV mode
      } else if (suggestions.length > 0) {
        request.suggestions = suggestions
        request.restrictedBySuggestions = !allowCustomValues
      } else if (showPicklist) {
        request.restrictedBySuggestions = !allowCustomValues
      }

      const encodedCsv = csvContent ? btoa(csvContent) : undefined
      await onSubmit?.(request, encodedCsv)
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError = e instanceof Error ? e.message : 'Failed to create attribute'
    } finally {
      submitting = false
    }
  } else {
    // Edit mode
    if (!attribute?.id) return

    submitting = true
    try {
      const subscribedApplicationsIds = selectedAppIds.length > 0 ? selectedAppIds : undefined

      const request: Omit<UpdateAttributeRequest, 'attributeId'> = {
        title: name || undefined,
        description: description || undefined,
        subscribedApplicationsIds
      }

      if (hasCsv) {
        // CSV mode — import handled separately
      } else if (suggestions.length > 0) {
        request.suggestions = suggestions
        request.restrictedBySuggestions = !allowCustomValues
      } else if (showPicklist) {
        request.suggestions = []
        request.restrictedBySuggestions = !allowCustomValues
      }

      const encodedCsv = csvContent ? btoa(csvContent) : undefined
      await onUpdate?.(request, encodedCsv)
      resetForm()
      onOpenChange(false)
    } catch (e) {
      submitError = e instanceof Error ? e.message : 'Failed to update attribute'
    } finally {
      submitting = false
    }
  }
}
```

**Step 7: Add handleDelete function**

```ts
async function handleDelete() {
  if (!attribute?.id) return
  deleting = true
  deleteError = ''
  try {
    await onDelete?.(attribute.id)
    deleteDialogOpen = false
    resetForm()
    onOpenChange(false)
  } catch (e) {
    deleteError = e instanceof Error ? e.message : 'Failed to delete attribute'
  } finally {
    deleting = false
  }
}
```

**Step 8: Update the Sheet template for dual mode**

Change the Sheet header:

```svelte
<Sheet.Header>
  <Sheet.Title>{mode === 'edit' ? 'Edit Attribute' : 'Create Attribute'}</Sheet.Title>
  <Sheet.Description class="text-sm text-foreground">
    To send specific data to PromoForge, create custom attributes, set a value for them via
    the integration API or via the Campaign Manager, and use them in your rules.
  </Sheet.Description>
</Sheet.Header>
```

For Entity, Type, and API Name sections, wrap them in `{#if mode === 'create'}...{:else}...{/if}`. In edit mode, render read-only styled fields:

```svelte
<!-- Entity -->
{#if mode === 'edit'}
  <div class="space-y-1.5">
    <Label class="text-sm font-medium">Entity</Label>
    <div class="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
      {ENTITY_LABELS[entity] ?? entity}
    </div>
  </div>
{:else}
  <!-- existing Entity select block -->
{/if}
```

Same pattern for Type:

```svelte
<!-- Type -->
{#if mode === 'edit'}
  <div class="space-y-1.5">
    <div class="flex items-center gap-1.5">
      <Label class="text-sm font-medium">Type</Label>
    </div>
    <div class="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
      {TYPE_LABELS[type] ?? type}
    </div>
  </div>
{:else}
  <!-- existing Type select block -->
{/if}
```

And API Name:

```svelte
<!-- API Name -->
{#if mode === 'edit'}
  <div class="space-y-1.5">
    <div class="flex items-center gap-1.5">
      <Label class="text-sm font-medium">API name</Label>
    </div>
    <div class="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-mono text-muted-foreground">
      {apiName}
    </div>
  </div>
{:else}
  <!-- existing API Name input block -->
{/if}
```

**Step 9: Add the Delete Danger Zone at the bottom of the scroll area**

After the Connected Applications section, before the closing `</div>` of the scrollable area, add:

```svelte
<!-- Delete Attribute (edit mode only) -->
{#if mode === 'edit'}
  <Separator class="my-2" />
  <div class="space-y-2 pt-2">
    <h3 class="text-base font-medium text-destructive">Delete Attribute</h3>
    <p class="text-sm text-muted-foreground">
      Deleting the attribute also deletes its values. This operation cannot be undone
      and the campaigns using this attribute will stop working.
    </p>
    <Button
      variant="outline"
      class="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
      onclick={() => (deleteDialogOpen = true)}
    >
      <Trash2 size={14} class="mr-1.5" />
      Delete Attribute
    </Button>
  </div>
{/if}
```

**Step 10: Add the Delete Confirmation Dialog**

After the closing `</Sheet.Root>` tag, add the Dialog:

```svelte
<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete Attribute</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete {attribute?.title ?? attribute?.name ?? 'this attribute'}? This action is permanent.
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
          Delete Attribute
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

**Step 11: Update the footer button text**

```svelte
<Sheet.Footer class="border-t px-6 py-4">
  <Button variant="ghost" onclick={handleCancel} disabled={submitting}>
    Cancel
  </Button>
  <Button onclick={handleSubmit} disabled={submitting}>
    {#if submitting}
      {mode === 'edit' ? 'Updating...' : 'Creating...'}
    {:else}
      {mode === 'edit' ? 'Update Attribute' : 'Create Attribute'}
    {/if}
  </Button>
</Sheet.Footer>
```

**Step 12: Verify no type errors**

Run: `make check`
Expected: No errors related to AttributeSheet.

**Step 13: Commit**

```bash
git add -A
git commit -m "feat: refactor CreateAttributeSheet into dual-mode AttributeSheet"
```

---

### Task 4: Wire up the page to use the new components

**Files:**
- Modify: `src/routes/(app)/settings/tools/attributes/+page.svelte`

**Step 1: Update imports and wire edit sheet**

Replace the `CreateAttributeSheet` import:

```ts
import AttributeSheet from '$lib/components/attributes/AttributeSheet.svelte'
```

Pass `onEdit` to `AttributeTable`:

```svelte
<AttributeTable
  attributes={attributeStore.paginatedAttributes}
  onEdit={(attr) => attributeStore.openEditSheet(attr)}
/>
```

Replace the `CreateAttributeSheet` usage at the bottom with both create and edit sheets:

```svelte
<!-- Create Sheet -->
<AttributeSheet
  mode="create"
  open={attributeStore.createSheetOpen}
  onOpenChange={(v) => (attributeStore.createSheetOpen = v)}
  onSubmit={async (req, csvContent) => { await attributeStore.createAttribute(req, csvContent) }}
  applications={applicationStore.applications}
/>

<!-- Edit Sheet -->
<AttributeSheet
  mode="edit"
  attribute={attributeStore.editingAttribute ?? undefined}
  open={attributeStore.editSheetOpen}
  onOpenChange={(v) => { if (!v) attributeStore.closeEditSheet() }}
  onUpdate={async (req, csvContent) => {
    if (attributeStore.editingAttribute?.id) {
      await attributeStore.updateAttributeData(attributeStore.editingAttribute.id, req, csvContent)
    }
  }}
  onDelete={async (id) => {
    await attributeStore.removeAttribute(id)
  }}
  applications={applicationStore.applications}
/>
```

**Step 2: Verify no type errors**

Run: `make check`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/routes/\(app\)/settings/tools/attributes/+page.svelte
git commit -m "feat: wire up edit/delete attribute sheet on attributes page"
```

---

### Task 5: Seed an editable attribute for E2E tests

**Files:**
- Modify: `e2e/global-setup.ts`

**Step 1: Add an editable attribute to the seed data**

Add a new attribute config to the `attributeConfigs` array specifically for testing edit/delete — one with `suggestions` so we can verify picklist pre-population:

```ts
{
  entity: "ATTRIBUTE_ENTITY_APPLICATION",
  name: "e2e_editable_attr",
  title: "Editable Attr",
  type: "ATTRIBUTE_TYPE_STRING",
  description: "Attribute for edit/delete E2E tests",
  suggestions: ["option_a", "option_b", "option_c"],
  restrictedBySuggestions: true,
},
```

**Step 2: Commit**

```bash
git add e2e/global-setup.ts
git commit -m "test: add editable attribute seed for edit/delete E2E tests"
```

---

### Task 6: Write E2E tests for edit attribute

**Files:**
- Modify: `e2e/tests/attributes.spec.ts`

**Step 1: Write the edit attribute test**

Add after the existing "should sort attributes" test:

```ts
test("should open edit sheet with pre-populated data when clicking pen icon", async ({ page }) => {
  // Hover over the "Editable Attr" row to reveal pen icon
  const row = page.locator("table tbody tr").filter({ hasText: "Editable Attr" });
  await row.hover();

  // Click the pen icon
  const editButton = row.getByLabel(/Edit Editable Attr/);
  await expect(editButton).toBeVisible();
  await editButton.click();

  // Sheet should open with "Edit Attribute" title
  await expect(page.getByRole("heading", { name: "Edit Attribute" })).toBeVisible();

  // Verify read-only fields are displayed as text (not inputs)
  await expect(page.getByText("Application")).toBeVisible();
  await expect(page.getByText("String", { exact: true })).toBeVisible();
  await expect(page.getByText("e2e_editable_attr")).toBeVisible();

  // Verify editable fields are pre-populated
  const nameInput = page.locator("input").filter({ hasText: /Editable Attr/ });
  await expect(page.getByPlaceholder("e.g. Order Status")).toHaveValue("Editable Attr");
  await expect(page.getByPlaceholder("Describe what this attribute is used for...")).toHaveValue(
    "Attribute for edit/delete E2E tests"
  );

  // Verify suggestions are pre-populated as tags
  await expect(page.getByText("option_a")).toBeVisible();
  await expect(page.getByText("option_b")).toBeVisible();
  await expect(page.getByText("option_c")).toBeVisible();

  // Cancel to close
  await page.getByRole("button", { name: "Cancel" }).click();
});

test("should edit attribute name and description", async ({ page }) => {
  // Open edit sheet for "Editable Attr"
  const row = page.locator("table tbody tr").filter({ hasText: "Editable Attr" });
  await row.hover();
  await row.getByLabel(/Edit Editable Attr/).click();
  await expect(page.getByRole("heading", { name: "Edit Attribute" })).toBeVisible();

  // Intercept the update request
  const updatePromise = page.waitForRequest(
    (req) => req.url().includes("/api/v1/attributes/") && req.method() === "PUT"
  );

  // Modify name
  const nameInput = page.getByPlaceholder("e.g. Order Status");
  await nameInput.clear();
  await nameInput.fill("Updated Attr");

  // Modify description
  const descInput = page.getByPlaceholder("Describe what this attribute is used for...");
  await descInput.clear();
  await descInput.fill("Updated description");

  // Submit
  await page.getByRole("button", { name: "Update Attribute" }).click();

  // Verify the update request payload
  const updateRequest = await updatePromise;
  const body = updateRequest.postDataJSON();
  expect(body.title).toBe("Updated Attr");
  expect(body.description).toBe("Updated description");

  // Sheet should close and table should show updated name
  await expect(page.getByText("Updated Attr")).toBeVisible({ timeout: 10_000 });
});
```

**Step 2: Commit**

```bash
git add e2e/tests/attributes.spec.ts
git commit -m "test: add E2E tests for editing attributes"
```

---

### Task 7: Write E2E tests for delete attribute and cancel delete

**Files:**
- Modify: `e2e/tests/attributes.spec.ts`

**Step 1: Write the delete and cancel-delete tests**

Add after the edit tests. Note: these tests run serially, so the attribute name may have been updated by the previous test. Use the updated name:

```ts
test("should show delete confirmation and cancel it", async ({ page }) => {
  // Open edit sheet for the attribute (may have been renamed to "Updated Attr")
  const row = page.locator("table tbody tr").filter({ hasText: "Updated Attr" });
  await row.hover();
  await row.getByLabel(/Edit Updated Attr/).click();
  await expect(page.getByRole("heading", { name: "Edit Attribute" })).toBeVisible();

  // Scroll down to delete section and click Delete Attribute
  const deleteButton = page.getByRole("button", { name: "Delete Attribute" }).first();
  await deleteButton.scrollIntoViewIfNeeded();
  await deleteButton.click();

  // Verify confirmation dialog appears
  const dialog = page.locator("[role='alertdialog'], [role='dialog']").filter({ hasText: "Are you sure" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("This action is permanent")).toBeVisible();

  // Click Cancel
  await dialog.getByRole("button", { name: "Cancel" }).click();

  // Dialog should close, sheet should still be open
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Edit Attribute" })).toBeVisible();

  // Close the sheet
  await page.getByRole("button", { name: "Cancel" }).click();
});

test("should delete an attribute", async ({ page }) => {
  // Verify attribute exists first
  await expect(page.getByText("Updated Attr")).toBeVisible();

  // Open edit sheet
  const row = page.locator("table tbody tr").filter({ hasText: "Updated Attr" });
  await row.hover();
  await row.getByLabel(/Edit Updated Attr/).click();
  await expect(page.getByRole("heading", { name: "Edit Attribute" })).toBeVisible();

  // Intercept the delete request
  const deletePromise = page.waitForRequest(
    (req) => req.url().includes("/api/v1/attributes/") && req.method() === "DELETE"
  );

  // Click Delete Attribute button in the danger zone
  const deleteButton = page.getByRole("button", { name: "Delete Attribute" }).first();
  await deleteButton.scrollIntoViewIfNeeded();
  await deleteButton.click();

  // Confirm in dialog
  const dialog = page.locator("[role='alertdialog'], [role='dialog']").filter({ hasText: "Are you sure" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Delete Attribute" }).click();

  // Wait for delete request
  await deletePromise;

  // Both dialog and sheet should close
  await expect(dialog).toBeHidden({ timeout: 5_000 });

  // Attribute should no longer appear in the table
  await expect(page.getByText("Updated Attr")).toBeHidden({ timeout: 10_000 });
});
```

**Step 2: Commit**

```bash
git add e2e/tests/attributes.spec.ts
git commit -m "test: add E2E tests for delete attribute with confirmation"
```

---

### Task 8: Run full E2E test suite and fix issues

**Step 1: Run E2E tests**

Run: `make test-e2e`

Expected: All existing + new tests pass. This command tears down Docker, rebuilds, seeds, runs tests, and cleans up.

**Step 2: Fix any failures**

If tests fail, investigate the output. Common issues to watch for:
- Svelte 5 `onclick` not firing in Bits UI portals — use `evaluate((el) => el.click())` instead
- Timing issues — add `waitForTimeout` or more specific `waitFor` assertions
- Selector issues — inspect the actual DOM structure in the test trace

**Step 3: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: address E2E test issues for attribute edit/delete"
```
