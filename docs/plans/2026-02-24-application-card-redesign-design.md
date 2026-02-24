# Application Card Redesign

## Goal

Redesign `ApplicationCard.svelte` to show environment badge, app name, an edit button, and campaign stats with colored status indicators.

## Layout

```
┌─────────────────────────────────────────────────┐
│  ⚡ LIVE                                   ✏️   │
│                                                 │
│  KSA Production                                 │
│                                                 │
│  1,975 CAMPAIGNS                                │
│  🟢 182 running  🟡 1,132 disabled  🔴 661 expired │
└─────────────────────────────────────────────────┘
```

## Changes

### 1. Environment badge (top-left)
Keep existing `Badge` with `live`/`sandbox` variant. No changes needed.

### 2. Edit button (top-right)
- Ghost icon button (pencil icon from `lucide-svelte`)
- Visible on card hover (`opacity-0 group-hover:opacity-100` transition)
- `onclick` stops propagation so it doesn't trigger the card's link navigation
- Emits an `onedit` callback prop

### 3. Remove description
Replace the description section with campaign stats.

### 4. Campaign stats section
- **Total count label:** e.g. "1,975 CAMPAIGNS" — uppercase, small text, muted color
- **Breakdown row:** colored dots + count + label for each status:
  - Green dot (`bg-success`) — "running"
  - Yellow dot (`bg-warning`) — "disabled"
  - Red dot (`bg-coral`) — "expired"
- Stats are hardcoded random data for now (no campaigns API yet)

### 5. Props changes
- Add `onedit?: () => void` callback prop
- Remove reliance on `application.description`

## Random stats generation
Use a simple seeded approach based on `application.id` so stats stay stable across re-renders:
```ts
const total = 200 + (application.id ?? 0) * 137 % 2000
const running = Math.floor(total * 0.1 + (application.id ?? 0) * 7 % (total * 0.3))
const disabled = Math.floor(total * 0.4 + (application.id ?? 0) * 13 % (total * 0.2))
const expired = total - running - disabled
```

## No new files
All changes happen in `ApplicationCard.svelte`. No new components needed.
