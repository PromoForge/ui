# Custom Effects Feature Design

## Overview
Full CRUD implementation for custom effects management. Custom effects allow users to define custom promotion effects with typed parameters and JSON payloads. Uses separate page routing (not sheets) for create/edit views, with CodeMirror for the payload editor.

## Route Structure
```
src/routes/(app)/settings/tools/custom-effects/
├── +page.svelte              # List page (table + search)
├── new/
│   └── +page.svelte          # Create form
└── [id]/
    └── +page.svelte          # Edit form (pre-populated)
```

## Supporting Files
```
src/lib/services/customEffectService.ts
src/lib/stores/customEffectStore.svelte.ts
src/lib/components/custom-effects/
├── CustomEffectTable.svelte
├── CustomEffectForm.svelte
├── CustomEffectParametersInput.svelte
└── CustomEffectPayloadEditor.svelte
```

## API Endpoints Used
- `backstageServiceListCustomEffects` — list with optional filtering
- `backstageServiceGetCustomEffect` — get by ID
- `backstageServiceCreateCustomEffect` — create
- `backstageServiceUpdateCustomEffect` — update
- `backstageServiceDeleteCustomEffect` — delete
- `backstageServiceConnectCustomEffectApplication` — connect app
- `backstageServiceDisconnectCustomEffectApplication` — disconnect app

## Data Types
```typescript
CustomEffect {
  id, accountId, apiName, ruleBuilderName, description,
  scope (SESSION | CART_ITEM), parameters[], payload,
  enabled, connectedApplicationIds[], createTime, updateTime
}

CustomEffectParameter {
  name, type (STRING | NUMBER | BOOLEAN | TIME), description, picklist[]
}
```

## Pages

### List Page
- Page title "Custom Effects" with "+ Create Custom Effect" primary button
- Search bar (filters by name or description, client-side)
- Table columns: ID, Title (two-line: rule builder name as link + API name), Applications (icon + count), Scope
- Clicking title link navigates to edit page

### Create Page (`/new`)
- Yellow warning banner: "The custom effect scope cannot be changed after the custom effect is created."
- Properties section: Scope radio (Cart Session / Item), API name, Rule Builder name, Description, Applications multi-select
- Parameters section: Repeatable rows (type dropdown, name, description) with add/remove/reorder
- Payload section: Reference box showing template syntax + CodeMirror JSON editor
- Cancel / Create buttons (Create disabled until valid)

### Edit Page (`/[id]`)
- Breadcrumb: "Custom Effects > [Effect Name]"
- "Delete Custom Effect" danger button (top-right)
- Blue info banner when effect is used in rules: "You cannot change the parameters of custom effects used in rules."
- Same form as create but pre-populated, scope radio disabled
- Green checkmark indicators for valid fields
- Cancel / Save buttons (Save disabled when no changes or invalid)

## Components

### CustomEffectForm (shared create/edit)
- Props: `mode: "create" | "edit"`, optional `customEffect`
- Handles form state, validation, field layout
- Scope radio disabled in edit mode

### CustomEffectParametersInput
- Repeatable rows: type dropdown (string/number/boolean/time/list of strings), name input, description input
- Add row button, delete row icon, reorder handle

### CustomEffectPayloadEditor
- CodeMirror 6 with JSON language support
- Read-only reference box with template syntax examples
- Dark-ish theme, validation indicator

### CustomEffectTable
- Props: effects list, onEdit callback
- Renders table with ID, Title, Applications, Scope columns

## Data Flow
1. List page: store loads all effects on mount, search filters client-side, pagination
2. Create: form collects data, service calls createCustomEffect, navigate to list on success
3. Edit: load single effect via getCustomEffect(id), pre-populate form, updateCustomEffect on save
4. Delete: confirmation dialog, deleteCustomEffect, navigate to list

## E2E Tests
- List page loads and displays effects
- Search filters results
- Create flow: fill form, submit, verify in list
- Edit flow: modify fields, save, verify changes
- Delete flow: delete with confirmation, verify removed
