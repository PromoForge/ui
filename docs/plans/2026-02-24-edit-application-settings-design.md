# Edit Application — Settings Details Page

## Summary

Implement the edit application flow: clicking the pencil icon on an ApplicationCard navigates to the settings page (`/applications/{id}/settings-app`) where users can edit the application's name, description, currency, and timezone via the "Details" sub-tab.

## Page Layout

Two-column layout inside the existing app shell:

- **Left sidebar**: Vertical nav listing sub-tabs. Only "Details" is active now; future sub-tabs (Default Budgets, Mandatory Attributes, etc.) added later as new components + nav entries.
- **Right content area**: Renders the active sub-tab component.
- **Top**: Breadcrumb — `Apps > {AppName} > Settings`

No SvelteKit sub-routing. A single `$state` variable tracks the active tab and renders the matching component.

## Details Form

New component: `src/lib/components/settings/ApplicationDetailsForm.svelte`

| Field       | Component  | Notes                                         |
|-------------|------------|-----------------------------------------------|
| Name        | `Input`    | Required, text                                |
| Description | `Textarea` | Optional, multiline                           |
| Currency    | `Select`   | Hardcoded ~15 common currencies (SAR, USD, EUR, etc.) |
| Timezone    | `Select`   | Hardcoded ~20 common IANA timezones           |

Form state: Clone current application into local `$state`. Derive `hasChanges` by comparing against original. Save button shows "No Changes" (disabled) when clean, "Save Changes" when dirty.

Validation: Name required (non-empty). Currency and timezone must be selected.

## API Integration

- **Load**: Read from `applicationStore.selectedApplication` (already populated).
- **Save**: Call `backstageServiceUpdateApplication` with application ID and changed fields. On success, update the store. On error, display inline error via shadcn `Alert`.
- **Cancel**: Reset form to original values.

## Edit Button Wiring

In `ApplicationPanel.svelte`, pass `onedit` to each `ApplicationCard`:

```svelte
onedit={() => goto(`/applications/${app.id}/settings-app`)}
```

## shadcn Components Used

Input, Textarea, Select, Button, Breadcrumb, Alert, Separator

## Files Changed

- `src/routes/applications/[id]/settings-app/+page.svelte` — Replace stub with settings layout
- `src/lib/components/settings/ApplicationDetailsForm.svelte` — New details form
- `src/lib/components/layout/ApplicationPanel.svelte` — Wire `onedit` to navigate
