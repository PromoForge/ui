# Settings Page & Attributes Feature Design

**Date:** 2026-02-25
**Status:** Approved

## Overview

Restructure the settings page with a Talon.one-style sidebar navigation and build a fully functional Attributes management page under Tools. The settings sidebar mirrors Talon.one's "MANAGE ACCOUNT" structure exactly, with skeleton placeholders for all sections except Attributes which is fully functional with real API integration.

## Architecture: File-Based Routing (Approach A)

Each settings section gets its own `+page.svelte`. A `settings/+layout.svelte` provides the settings sidebar. URLs change as you navigate (`/settings/tools/attributes`, `/settings/overview`, etc.).

## Settings Sidebar Structure

```
MANAGE ACCOUNT
  Overview              → /settings/overview (existing components)
  Organization          → /settings/organization (skeleton)
  Integrations          → /settings/integrations (skeleton)
  Credentials           → /settings/credentials (skeleton)
  Tools (expandable)
    Attributes          → /settings/tools/attributes (FULLY FUNCTIONAL)
    Additional Costs    → /settings/tools/additional-costs (skeleton)
    Collections         → /settings/tools/collections (skeleton)
    Cart Item Catalogs  → /settings/tools/cart-item-catalogs (skeleton)
    Custom Effects      → /settings/tools/custom-effects (skeleton)
    Webhooks            → /settings/tools/webhooks (skeleton)
    Management API Keys → /settings/tools/management-api-keys (skeleton)
    API Tester          → /settings/tools/api-tester (skeleton)
  Logs (expandable)     → /settings/logs (skeleton)
```

### Settings Layout

- `settings/+layout.svelte` renders two-column layout: SettingsSidebar (280px) + content slot
- Uses shadcn Sidebar components (already installed)
- Active item highlighted with primary blue (#2563EB)
- Collapsible sections (Tools, Organization, Logs) with expand/collapse toggle
- `settings/+page.svelte` redirects to `/settings/overview`

### Overview Page

Composes three existing components vertically:
1. `ApplicationDetailsForm` — App name, description, currency, timezone
2. `PromotionEngineSettings` — Discount scope, feature toggles
3. `AdvancedSettings` — Case sensitivity

## Attributes Page

Located at `/settings/tools/attributes/+page.svelte`.

### Page Layout

- **Header:** "Attributes" title (left) + "+ Create Attribute" button (right, primary blue)
- **Tabs:** Custom | Built-in (shadcn Tabs, blue underline indicator)
  - Custom: `isBuiltin === false` or `undefined`
  - Built-in: `isBuiltin === true`
- **Toolbar row:** Search input (left) + Filter button + Sort button (right)
- **Table:** Attribute data with shadcn Table components
- **Pagination:** "1 – 50" with < > navigation (bottom-right)

### Table Columns

| Column | Source | Rendering |
|--------|--------|-----------|
| ATTRIBUTE | `title` | Colored badge (deterministic color from title hash) |
| API NAME | `name` | Monospace text |
| ENTITY | `entity` | Human-readable label mapping |
| TYPE | `type` | Human-readable label mapping |
| VISIBILITY | `editable` | shadcn Switch toggle (calls updateAttribute on toggle) |

Note: CAMPAIGNS column from reference is skipped — API doesn't support it.

### Entity Label Mapping

```
ATTRIBUTE_ENTITY_APPLICATION       → "Application"
ATTRIBUTE_ENTITY_CUSTOMER_SESSION  → "Current Session"
ATTRIBUTE_ENTITY_CUSTOMER_PROFILE  → "Customer Profile"
ATTRIBUTE_ENTITY_EVENT             → "Event"
ATTRIBUTE_ENTITY_CART_ITEM         → "Item"
ATTRIBUTE_ENTITY_COUPON            → "Coupon"
ATTRIBUTE_ENTITY_STORE             → "Store"
ATTRIBUTE_ENTITY_REFERRAL          → "Referral"
ATTRIBUTE_ENTITY_GIVEAWAY          → "Giveaway"
ATTRIBUTE_ENTITY_CAMPAIGN          → "Campaign"
```

### Type Label Mapping

```
ATTRIBUTE_TYPE_STRING          → "String"
ATTRIBUTE_TYPE_NUMBER          → "Number"
ATTRIBUTE_TYPE_BOOLEAN         → "Boolean"
ATTRIBUTE_TYPE_TIME            → "Time"
ATTRIBUTE_TYPE_LOCATION        → "Location"
ATTRIBUTE_TYPE_LIST_OF_STRINGS → "List (Strings)"
ATTRIBUTE_TYPE_LIST_OF_NUMBERS → "List (Numbers)"
```

## Filter Dropdown

**Component:** `AttributeFilterDropdown.svelte` — Bits UI Popover

### Two-Level Navigation

1. **Level 1 (Category List):** Entity, Type, Visibility — each with label + right chevron
2. **Level 2 (Options):** Back arrow + category name header, scrollable checkbox list

### Filter State

```typescript
type FilterState = {
  entity: Set<string>;
  type: Set<string>;
  visibility: Set<string>; // "visible" | "hidden" → maps to editable boolean
}
```

### Styling

- Default: white bg, thin gray border, funnel icon + "Filter" text
- Hover: border + icon shift to lighter blue
- Active/open: deeper blue border + text
- Selected checkboxes: solid blue fill, checked row gets light indigo bg
- Row hover: very light blue-grey bg
- Active filter badge/dot when filters are applied

### Drill-in Animation

CSS `transform: translateX` slide between levels for polished feel.

## Sort Dropdown

**Component:** `AttributeSortDropdown.svelte` — Bits UI Popover

### Options

1. **Most Used** (default) — sorts by `id` descending (newest first as proxy)
2. **Name A-Z** — sorts by `title` ascending
3. **Name Z-A** — sorts by `title` descending

### Styling

- Icon-only square button, same size/rounding as Filter
- "SORT BY" header in uppercase muted text with separator
- Selected option: indigo/periwinkle background highlight
- Same hover/active color progression as Filter

## Create Attribute Sheet

**Component:** `CreateAttributeSheet.svelte` — shadcn Sheet (slides from right)

### Form Fields

1. **Entity** (Required) — Select dropdown, all entity enum values
2. **Type** (Required) — Select dropdown, all type enum values
3. **API name** (Required) — Text input, alphanumeric + underscores only
4. **Name** — Text input with "0 / 20" character counter, maps to `title`
5. **Description** — Textarea
6. **Connected Applications** — Multi-select, "All Applications" default, maps to `subscribedApplicationsIds`

### Validation

- Entity and Type required — red border + "Required" text after attempted submit
- API name required — alphanumeric + underscores only validation
- Name max 20 characters

### Auto-Slug Generation

When user types a Name (e.g. "Order Status"), API name auto-populates with `order_status`. Manual edit stops auto-generation.

### Actions

- Cancel (ghost) — closes sheet
- Create Attribute (primary blue) — submits, refreshes list, shows success toast

## Data Flow

### Service: `attributeService.ts`

```
listAttributes()    → backstageServiceListAttributes
createAttribute()   → backstageServiceCreateAttribute
updateAttribute()   → backstageServiceUpdateAttribute
deleteAttribute()   → backstageServiceDeleteAttribute
archiveAttribute()  → backstageServiceArchiveAttribute
```

### Store: `attributeStore.svelte.ts`

**State ($state):**
- `attributes`, `loading`, `error`
- `activeTab`, `searchQuery`, `filters`, `sortBy`
- `page`, `pageSize` (50), `createSheetOpen`

**Derived ($derived):**
- `filteredAttributes` — tab → search → entity/type/visibility → sort
- `paginatedAttributes` — slice for current page
- `totalPages`, `activeFilterCount`

### Pipeline

```
Fetch all → Tab filter → Search filter → Entity/Type/Visibility filter → Sort → Paginate → Render
```

All filtering/sorting is client-side for instant feedback.

## New Files

```
src/lib/
├── services/attributeService.ts
├── stores/attributeStore.svelte.ts
├── components/attributes/
│   ├── AttributeTable.svelte
│   ├── CreateAttributeSheet.svelte
│   ├── AttributeFilterDropdown.svelte
│   └── AttributeSortDropdown.svelte
src/routes/(app)/settings/
├── +layout.svelte
├── +page.svelte (redirect)
├── SettingsSidebar.svelte
├── overview/+page.svelte
├── organization/+page.svelte (skeleton)
├── integrations/+page.svelte (skeleton)
├── credentials/+page.svelte (skeleton)
├── tools/
│   ├── attributes/+page.svelte
│   ├── additional-costs/+page.svelte (skeleton)
│   ├── collections/+page.svelte (skeleton)
│   ├── cart-item-catalogs/+page.svelte (skeleton)
│   ├── custom-effects/+page.svelte (skeleton)
│   ├── webhooks/+page.svelte (skeleton)
│   ├── management-api-keys/+page.svelte (skeleton)
│   └── api-tester/+page.svelte (skeleton)
└── logs/+page.svelte (skeleton)
```

## Creative Enhancements

1. **Auto-slug generation** — Name → API name auto-conversion
2. **Deterministic badge colors** — Generated from attribute title hash
3. **Empty state** — Friendly illustration + CTA when no attributes exist
4. **Active filter badge** — Blue dot on Filter button when filters are applied
5. **Drill-in animation** — Smooth slide transition in filter dropdown
