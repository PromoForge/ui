# Additional Costs Page — Design

## Overview

CRUD page for managing additional costs (e.g., shipping fees). Mirrors the existing attributes page pattern: store + service + page + sheet component.

## Files

**New:**
- `src/routes/(app)/settings/tools/additional-costs/+page.svelte` — List page
- `src/lib/components/additional-costs/AdditionalCostTable.svelte` — Table
- `src/lib/components/additional-costs/AdditionalCostSheet.svelte` — Create/Edit sheet
- `src/lib/stores/additionalCostStore.svelte.ts` — Rune-based store
- `src/lib/services/additionalCostService.ts` — API service layer
- `e2e/tests/additional-costs.spec.ts` — E2E tests

**Modified:**
- Sidebar nav — add "Additional Costs" under Tools

## API Mapping

| SDK Function | Usage |
|---|---|
| `backstageServiceListAdditionalCosts` | Load list |
| `backstageServiceCreateAdditionalCost` | Create |
| `backstageServiceUpdateAdditionalCost` | Edit |
| `backstageServiceDeleteAdditionalCost` | Delete |
| `backstageServiceListApplications` | Connected Applications dropdown |

## AdditionalCost Schema

```typescript
{
  id: number;
  name: string;          // API name
  title: string;         // Rule Builder name
  description: string;
  type: 'ADDITIONAL_COST_TYPE_SESSION' | 'ADDITIONAL_COST_TYPE_ITEM' | 'ADDITIONAL_COST_TYPE_BOTH';
  subscribedApplicationsIds: number[];
}
```

## List Page

- Header: "Additional Costs" + "Create Additional Cost" button
- Search bar filtering by title and name
- Table columns: Title (clickable), API Name, Scope, Description
- Scope shows badge(s): "Cart (Session)" / "Item" — BOTH type shows two badges
- Pagination footer with item count + prev/next

## Create Sheet (mode="create")

Right-side Sheet with fields:
1. **Scope** — Two checkboxes: "Cart (Session)" + "Item". At least one required. Maps to SESSION/ITEM/BOTH.
2. **API Name** — Auto-slugified from title, regex `^[a-zA-Z0-9_]+$`. Info tooltip.
3. **Rule Builder Name** — Text input, 20 char max with counter. Maps to `title`.
4. **Rule Builder Description** — Text input. Maps to `description`.
5. **Connected Applications** — Multi-select popover with checkboxes + removable chips.

Footer: Cancel + "Create Additional Cost"

## Edit Sheet (mode="edit")

Same Sheet, opens on title click. Differences:
- API Name is read-only (grey bg, monospace)
- Scope remains editable
- Danger Zone below separator: "Delete Additional Cost" heading, warning text, red delete button → confirmation Dialog

Footer: Cancel + "Save"

## Store

State: `additionalCosts`, `loading`, `error`, `searchQuery`, `currentPage`, `pageSize`, `createSheetOpen`, `editSheetOpen`, `editingCost`

Derived: `filteredCosts`, `paginatedCosts`, `totalFiltered`, `totalPages`

## E2E Tests

- List page renders with seeded data
- Search filters by name
- Create flow with validation
- Edit flow with pre-populated fields
- Delete with confirmation dialog
