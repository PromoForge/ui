# Applications API Integration & Standardized Form Design

**Goal:** Connect the application list page to real APIs (replacing mocks), add a create application form via a reusable slide-in panel, and establish a standardized form pattern for the project.

**Scope:** Application list + create. Future pages reuse the same SlidePanel and form primitives.

---

## 1. API Integration

### Service Layer

Replace mock implementations in `applicationService.ts` with SDK calls:

- `getApplications()` → `backstageServiceListApplications()` → `GET /v1/applications`
- `getApplication(id)` → `backstageServiceGetApplication({ path: { applicationId } })` → `GET /v1/applications/{id}`
- `createApplication(data)` (new) → `backstageServiceCreateApplication({ body: data })` → `POST /v1/applications`

### Types

Drop local `Application` type (`src/lib/types/application.ts`). Use SDK types directly from `$lib/api/generated/types.gen` throughout the UI.

The SDK `Application` type has: `id?: number`, `name?: string`, `environment?: 'APPLICATION_ENVIRONMENT_SANDBOX' | 'APPLICATION_ENVIRONMENT_LIVE'`, `currency?: string`, `timezone?: string`, `caseSensitivity?`, etc.

Update all components and stores that reference the local type.

### Store

`applicationStore.svelte.ts` stays the same structurally — it already calls async service functions. Just update the `Application` import source and adapt any field references (e.g., `environment` enum values).

---

## 2. New UI Components

### `SlidePanel.svelte` (reusable)

Right-side slide-in panel for all create/edit forms.

- ~400px wide, slides in from right edge
- Semi-transparent backdrop overlay (click to close)
- Header: title text
- Body: scrollable content area (Svelte 5 `children` snippet)
- Footer: sticky bottom with Cancel (ghost button) + primary action button
- Props: `open` (bindable), `title`, `submitLabel`, `onsubmit`, `oncancel`, `loading`
- CSS transitions for slide + fade animation

### `Select.svelte` (reusable)

Dropdown select input matching existing Input component styling.

- Props: `value` (bindable), `options: { value: string, label: string }[]`, `class`
- Used for: currency, timezone, caseSensitivity, environment

### `FormField.svelte` (reusable)

Label + input wrapper with consistent spacing.

- Props: `label`, `required` (boolean), `children` snippet
- Renders: label text above the input, consistent gap

### `Textarea.svelte` (reusable)

Multi-line text input, same styling as Input but taller.

- Props: same as Input but renders `<textarea>`

### `CreateApplicationForm.svelte` (application-specific)

Form content rendered inside SlidePanel. 6 fields from the API:

1. **Name** — text Input (required)
2. **Description** — Textarea (optional)
3. **Currency** — Select with ISO 4217 codes (e.g., SAR, USD)
4. **Timezone** — Select with IANA timezones (e.g., Asia/Riyadh)
5. **Code case sensitivity** — Select with options: Sensitive, Insensitive-Uppercase (recommended), Insensitive-Lowercase
6. **Application environment** — Select: Sandbox, Live

On submit: calls `applicationService.createApplication()`, refreshes list, closes panel.
On error: shows error message in panel, keeps panel open.

---

## 3. Data Flow

### List (page load)

```
Page mount → applicationStore.loadApplications()
  → applicationService.getApplications()
    → backstageServiceListApplications()
  → store.applications = response.data
  → ApplicationCard list renders
```

### Create (form submit)

```
User clicks "+ Create Application" button (existing in sidebar)
  → SlidePanel opens with CreateApplicationForm
  → User fills fields, clicks "Create Application"
    → applicationService.createApplication(formData)
      → backstageServiceCreateApplication({ body: formData })
    → Success: applicationStore.loadApplications(), close panel
    → Error: show error message in panel
```

---

## 4. Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Form pattern | Slide-in right panel | Matches Talon.One reference, keeps list context visible |
| Form architecture | Generic SlidePanel + per-form composition | Reusable shell, flexible form content |
| Type strategy | Use SDK types directly | Single source of truth, less mapping code |
| API integration point | Service layer only | Stores and UI unchanged structurally |
