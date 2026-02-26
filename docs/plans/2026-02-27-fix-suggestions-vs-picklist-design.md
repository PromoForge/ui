# Fix Suggestions vs Pick List Values in Attribute Creation

## Problem

The attribute creation UI conflates two distinct backend concepts:

1. **Suggestions** — inline string array on the attribute, sent with `CreateAttribute` request
2. **Allowed List (Pick List)** — uploaded via separate `ImportAttributeAllowedList` endpoint after attribute exists

Currently, the UI sends both tag input values AND CSV-uploaded values as inline `suggestions`, and incorrectly sets `hasAllowedList: true` whenever suggestions exist. The backend enforces that `restrictedBySuggestions` and `hasAllowedList` are mutually exclusive.

## Backend Contract

### Inline Suggestions
- `suggestions: string[]` on `CreateAttributeRequest`
- `restrictedBySuggestions: true` restricts values to this list
- Up to 50 values via UI

### Allowed List (CSV Import)
- `POST /api/v1/attributes/{attributeId}/allowed_list/import`
- Request: `{ attributeId, csvContent }` (base64 CSV with "item" column)
- Server sets `hasAllowedList = true` automatically
- Up to 500,000 values
- Overwrites any inline suggestions

### Mutual Exclusivity
- `restrictedBySuggestions` and `hasAllowedList` cannot both be true
- Server returns `InvalidArgument` if both are set

## Design

### UI Behavior

**Tag input (inline suggestions):**
- Values sent as `suggestions` in `CreateAttributeRequest`
- "Allow custom values" checkbox maps to `restrictedBySuggestions` (inverted)
- `hasAllowedList` is NOT set
- Max 50 values

**CSV upload (allowed list):**
- CSV file stored in state but NOT parsed into `suggestions`
- On submit: create attribute first, then call `ImportAttributeAllowedList`
- No "Allow custom values" checkbox (allowed lists are inherently restrictive)

**Mutual exclusivity in UI:**
- CSV upload clears and disables tag input, hides "allow custom values" checkbox
- Removing CSV re-enables tag input and checkbox
- Tags + CSV upload → CSV wins, tags cleared

### Submit Flow

1. Create attribute via `createAttribute()`:
   - If tag input used (no CSV): include `suggestions` + `restrictedBySuggestions`
   - If CSV uploaded: omit `suggestions`, omit `hasAllowedList` (server sets it)
2. If CSV was uploaded: call `importAttributeAllowedList(attributeId, csvContent)`
3. Error handling: if import fails, attribute still exists; show error, user can retry

### Files to Change

1. `src/lib/services/attributeService.ts` — add `importAttributeAllowedList()` wrapper
2. `src/lib/components/attributes/CreateAttributeSheet.svelte` — fix submit logic, separate CSV from tags, mutual exclusivity
3. `src/lib/stores/attributeStore.svelte.ts` — update `createAttribute` to support two-step flow
