# Webhooks Page Design

## Decisions

- **Navigation**: Sheet overlay (no URL change), consistent with catalogs/attributes
- **Credentials section**: Skipped — API has no credential field on webhooks yet
- **Payload editor**: CodeMirror 6 with JSON mode, line numbers
- **Sheet layout**: Wide two-column (~80vw) — form left, payload/preview/test right (sticky)
- **Test flow**: Create-then-test — clicking "Create Webhook" saves first, then immediately tests
- **Parameter types**: All 5 API types (String, Number, Boolean, Time, Long String)
- **Architecture**: Composable sub-components inside a single WebhookSheet

## Files

### Service Layer
**`src/lib/services/webhookService.ts`** — thin wrapper around generated SDK:
- `listWebhooks()` → `{ data: Webhook[], total: number }`
- `getWebhook(id)` → `Webhook`
- `createWebhook(request)` → `Webhook`
- `updateWebhook(id, request)` → `Webhook`
- `deleteWebhook(id)` → void
- `testWebhook(id)` → test result
- `copyWebhook(id)` → calls get then create with "(Copy)" name suffix

Uses generated types from `$lib/api/generated/types.gen`.

### Store
**`src/lib/stores/webhookStore.svelte.ts`** — Svelte 5 runes:
- **List state**: `webhooks[]`, `loading`, `error`, `searchQuery`, `currentPage`, `pageSize`
- **Derived**: `filteredWebhooks` (search on name/description), `paginatedWebhooks`, `totalPages`
- **Sheet state**: `createSheetOpen`, `editSheetOpen`, `editingWebhook`
- **Actions**: `loadWebhooks()`, `setSearchQuery()`, `addWebhook()`, `updateWebhook()`, `removeWebhook()`, `copyWebhook()`, `testWebhook()`, `openCreateSheet()`, `openEditSheet(webhook)`, `closeSheet()`

### List Page
**`src/routes/(app)/settings/tools/webhooks/+page.svelte`** — replaces "Coming soon" stub.

Layout:
1. Header: title "Webhooks" + "+ Create Webhook" button (PageActions)
2. Search input: magnifying glass icon, placeholder "Webhook or integration name"
3. Pagination: "X – Y of Z" + prev/next chevrons (right-aligned)
4. Table (shadcn Table):

| Column | Width | Content |
|--------|-------|---------|
| NAME | ~50% | Blue link name + muted description subtitle. Click opens edit sheet. |
| VERB | ~10% | HTTP method text |
| APPLICATIONS | ~25% | Grid icon + "All" or count. Tooltip shows app names on hover. |
| COPY | ~15% | Copy icon button. Duplicates webhook. |

### Sheet
**`src/lib/components/webhooks/WebhookSheet.svelte`** — wide sheet (~80vw), two-column grid.

Left column (scrollable):
1. Intro text (create mode only)
2. Name input (required)
3. Description textarea (optional)
4. Connected Applications — multi-select dropdown, default "All Applications"
5. Request Details — Verb dropdown (DELETE/GET/PATCH/POST/PUT), URL input with tooltip
6. Headers — WebhookHeadersInput component
7. Parameters — WebhookParametersInput component
8. [Edit only] Copy Webhook button
9. [Edit only] Delete Webhook button (red/danger)

Right column (sticky):
1. Payload — example template (read-only) + CodeMirror 6 JSON editor
2. Preview — live curl command (read-only) + Copy button
3. Test — warning badge + Test Webhook button + result display

Footer: Cancel | Save Draft | Create Webhook (or Save in edit mode)

### Sub-Components

**`WebhookHeadersInput.svelte`**
- Default rows (X-UUID, Content-Type) are read-only, no delete
- User-added rows have key/value inputs + trash icon
- "+ Add Header" button

**`WebhookParametersInput.svelte`**
- Each parameter: Type dropdown (5 types), Name input, Description input, trash icon
- "+ Add Parameter" button

**`WebhookPayloadEditor.svelte`**
- Read-only example template
- CodeMirror 6 with JSON mode, line numbers
- Dependencies: `codemirror`, `@codemirror/lang-json`

**`WebhookPreview.svelte`**
- Generates formatted curl command from verb, url, headers, payload
- Copy button for clipboard

**`WebhookTestSection.svelte`**
- Warning badge: "This step is required for saving changes."
- Test Webhook button (with send icon)
- Result display (success/failure)

## Flows

### Create
1. User fills form → clicks "Create Webhook"
2. Creates webhook via API
3. Immediately tests via `testWebhook(newId)`
4. Shows test result; sheet stays open in edit mode

### Edit
1. Sheet pre-fills from `editingWebhook`
2. User modifies → clicks "Save"
3. Updates webhook via API
4. Additional sections: Copy Webhook, Delete Webhook (red)

### Save Draft
Same as create/save but sets `enabled: false`

### Copy
Fetches webhook, creates new with "(Copy)" name suffix

### Delete
Red button in edit mode → confirmation dialog → deletes via API → closes sheet, refreshes list

## Testing

**`e2e/tests/webhooks.spec.ts`**:
1. List page loads — verifies title and empty state
2. Create webhook — fills form, submits, verifies in list
3. Edit webhook — clicks name, verifies pre-fill, modifies, saves
4. Copy webhook — clicks copy icon, verifies "(Copy)" webhook
5. Delete webhook — opens edit, deletes, verifies removal
6. Search — creates multiple, filters by search, verifies results

**Seed data** in `e2e/global-setup.ts` — 2-3 test webhooks via API.
