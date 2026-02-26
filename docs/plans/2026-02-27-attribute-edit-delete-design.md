# Attribute Edit & Delete — Design

## Overview

Add edit and delete functionality for custom attributes. Users hover a table row to reveal a pen icon, click it to open an edit sheet (reusing the create sheet in dual mode), and can delete from within the edit sheet via a confirmation dialog.

## Table Interaction

- Custom tab only: hovering a row reveals a `Pencil` icon (lucide-svelte, size 14) next to the attribute badge
- Icon uses `opacity-0 group-hover:opacity-100` transition on the table row
- Clicking the icon calls `onEdit(attribute)` callback prop
- Built-in attributes never show the pen icon

## Dual-Mode AttributeSheet

Refactor `CreateAttributeSheet` → `AttributeSheet` with `mode: 'create' | 'edit'` prop.

### Props

```ts
mode: 'create' | 'edit'
attribute?: Attribute        // required when mode='edit'
open: boolean
onOpenChange: (open: boolean) => void
onSubmit: (request, csvContent?) => Promise<void>   // create mode
onUpdate: (request) => Promise<void>                 // edit mode
onDelete: (attributeId: number) => Promise<void>     // edit mode
applications: Application[]
```

### Edit Mode Differences

- **Title:** "Edit Attribute"
- **Entity, Type, API Name:** read-only styled text (grey background, not disabled inputs)
- **Name:** pre-populated, editable, 20-char limit
- **Description:** pre-populated, editable
- **Picklist values:** pre-populated with `attribute.suggestions`
- **Connected Apps:** pre-populated with `attribute.subscribedApplicationsIds`
- **Delete Danger Zone:** separator + warning text + red "Delete Attribute" button at bottom of scroll area
- **Footer:** "Cancel" + "Update Attribute" primary button

### Form Initialization

`$effect` pre-populates form fields when `mode='edit'` and `attribute` changes. The type-clearing effect is guarded to only run in create mode.

## Delete Confirmation Dialog

- Shadcn Dialog centered on screen, overlaying the open sheet
- Title: "Delete Attribute"
- Body: "Are you sure you want to delete {name}? This action is permanent."
- Actions: "Cancel" (ghost) + "Delete Attribute" (destructive, red, Trash2 icon)
- Loading state during API call
- On success: closes both dialog and sheet
- On error: inline error in dialog

## Store Changes

### New State

- `editSheetOpen: boolean`
- `editingAttribute: Attribute | null`

### New Methods

- `openEditSheet(attribute)` — sets editingAttribute & opens sheet
- `closeEditSheet()` — resets both
- `updateAttribute(id, request, csvContent?)` — calls API, updates local array
- `deleteAttribute(id)` — calls API, removes from local array

### Data Flow

1. Table row hover → pen icon → click → `store.openEditSheet(attr)`
2. Sheet opens in edit mode, pre-populated from `store.editingAttribute`
3. Edit → "Update Attribute" → `updateAttributeApi` → update local array → close sheet
4. "Delete Attribute" → Dialog → confirm → `deleteAttributeApi` → remove from array → close both

## E2E Tests

New scenarios in `e2e/tests/attributes.spec.ts`:

- **Edit attribute:** hover → click pen → verify pre-populated sheet → modify name/description → submit → verify table updates
- **Delete attribute:** open edit sheet → click delete → verify dialog → confirm → verify removed from table
- **Cancel delete:** open dialog → cancel → verify sheet still open, attribute exists
- **Edit picklist values:** open edit → add/remove tags → update → verify changes persisted
