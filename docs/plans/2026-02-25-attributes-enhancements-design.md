# Attributes Page Enhancements Design

## Summary

Five enhancements to the attributes page: disable visibility toggle, fix filter dropdown bug, add type-specific picklist fields to the create sheet, multi-select connected applications, and time-type date picker.

## 1. Disable Visibility Toggle

**File:** `AttributeTable.svelte`

Add `disabled` prop to the `Switch` component. Add a `Tooltip` wrapping the switch explaining "Coming soon". The switch renders grayed out and non-interactive.

## 2. Fix Filter Dropdown Bug

**File:** `AttributeFilterDropdown.svelte`

**Root cause:** The second panel uses `{#if activeCategory}` inside the sliding container. Content doesn't exist until a category is clicked, causing a blank flash during the CSS slide transition.

**Fix:** Track a `lastCategory` state that persists the last selected category. Always render the options panel using `lastCategory`, so content is visible during the slide animation. Update `lastCategory` when `activeCategory` changes to a non-null value.

## 3. Type-Specific Picklist Fields

**File:** `CreateAttributeSheet.svelte`

### Conditional Logic

| Type | Picklist Section | Input Mode |
|------|-----------------|------------|
| String | Yes | Tag input (comma/enter to add) |
| Number | Yes | Tag input (comma/enter to add) |
| List (Strings) | Yes | Tag input (comma/enter to add) |
| List (Numbers) | Yes | Tag input (comma/enter to add) |
| Time | Yes | Date picker (calendar popover) |
| Boolean | No | - |
| Location | No | - |

### Picklist Section Layout

Appears after Description, before Connected Applications:

1. **Section header:** "Picklist values" (h3)
2. **Description text:** "Picklist values are predefined values for this attribute. Use them to control what values users can select for this attribute when they use it in a rule."
3. **Info box** (shadcn Alert): "Enter up to 50 values, each separated by a comma. If you need to enter more values, import a CSV file instead." (For Time type: "Enter up to 50 values.")
4. **Checkbox** (shadcn Checkbox): "Allow users to enter custom values in the Rule Builder" - maps to `restrictedBySuggestions` (inverted: checked = `restrictedBySuggestions: false`)
5. **Values label:** "Values"
6. **Tag input** (for non-Time types): Text input where typing a value and pressing Enter or comma adds it as a removable tag chip. Maps to `suggestions: string[]`.
7. **Date picker** (for Time type): shadcn Calendar + Popover. Selected dates render as formatted tag chips ("Feb 4, 2026 x"). Values stored as ISO date strings in `suggestions[]`.
8. **CSV upload section:** Text: "Import a CSV file of up to 500,000 values. The import overwrites any entered values and previous imports. Download a sample CSV file." Button: "Upload a CSV file". Parses CSV client-side, populates `suggestions[]`.

### API Field Mapping

- Tag values / date values -> `suggestions: string[]`
- "Allow custom values" checkbox -> `restrictedBySuggestions: boolean` (inverted)
- Having any picklist values -> `hasAllowedList: boolean` (auto-set when suggestions.length > 0)

### New shadcn Components Needed

- `Calendar` - for date picker (install via `bunx shadcn-svelte@latest add calendar`)
- `Alert` - for info box (install via `bunx shadcn-svelte@latest add alert`)

### Tag Input Implementation

Build a custom tag input using shadcn primitives (Input + Badge):
- Input field with tag chips rendered inline/above
- Each tag has an X button to remove
- Comma or Enter key adds current input as a new tag
- Max 50 tags enforced
- For Number type, validate that entered values are numeric

## 4. Multi-Select Connected Applications

**File:** `CreateAttributeSheet.svelte`

Replace single `Select` with multi-select pattern:

1. **Dropdown trigger:** Popover with a button showing "Select Applications" placeholder or count of selected
2. **Dropdown content:** List of available applications with checkboxes
3. **Selected apps list:** Below the dropdown, each selected app shown as a row with:
   - App name (truncated)
   - App description
   - Trash icon button to remove

### State Change

```
- selectedAppId: string = 'all'           // OLD: single
+ selectedAppIds: number[] = []            // NEW: multi (empty = all)
```

Maps to `subscribedApplicationsIds: number[]` in the API request. Empty array means available in all applications.

### shadcn Components Used

- `Popover` (already installed)
- `Checkbox` (already installed)
- `Button` (already installed)

## 5. Component Architecture

All changes in existing files:
- `src/lib/components/attributes/AttributeTable.svelte` - disable Switch + tooltip
- `src/lib/components/attributes/AttributeFilterDropdown.svelte` - fix blank options
- `src/lib/components/attributes/CreateAttributeSheet.svelte` - picklist fields + multi-select apps

New shadcn components to install: `calendar`, `alert`
