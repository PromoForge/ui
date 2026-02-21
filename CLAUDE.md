# PromoForge UI

Promotion engine frontend built with SvelteKit 2, Svelte 5, Tailwind CSS v4, and TypeScript.

## Commands

- `npm run dev` — Start dev server (port 5173)
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run check` — Run svelte-check for type errors

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/            # Reusable UI primitives (Button, Card, Input, Modal, etc.)
│   │   └── layout/        # App shell components (Sidebar, Header, AppShell)
│   ├── stores/            # Svelte 5 rune-based state (use .svelte.ts extension)
│   ├── services/          # API/backend service layer (stubs for now)
│   ├── types/             # Shared TypeScript type definitions
│   │   └── index.ts       # Re-exports all types
│   └── utils/             # Pure utility/helper functions
│       └── index.ts       # Re-exports all utils
├── routes/
│   ├── +layout.svelte     # Root layout — wraps all pages in AppShell
│   ├── +layout.ts         # SPA mode config (ssr=false, prerender=false)
│   ├── +page.svelte       # Dashboard page (/)
│   └── settings/
│       └── +page.svelte   # Settings page (/settings)
├── app.css                # Tailwind CSS v4 entry point
└── app.html               # HTML template
```

## Conventions

### Adding a new page
1. Create `src/routes/<page-name>/+page.svelte`
2. Add nav entry in `src/lib/components/layout/Sidebar.svelte` navItems array

### Adding a new UI component
1. Create `src/lib/components/ui/<ComponentName>.svelte`
2. Use Svelte 5 runes: `$props()`, `$state()`, `$derived()`
3. Accept Tailwind `class` prop via `let { class: className = '' } = $props()`

### Adding a new service
1. Create `src/lib/services/<name>.ts`
2. Export async functions that return typed data
3. Types go in `src/lib/types/<name>.ts`

### Adding a new store
1. Create `src/lib/stores/<name>.svelte.ts` (must use `.svelte.ts` extension for runes)
2. Use `$state()` and `$derived()` runes — do NOT use legacy `writable`/`readable`

### Adding auth (future)
1. Auth store: `src/lib/stores/auth.svelte.ts`
2. Auth service: `src/lib/services/auth.ts`
3. Auth types: `src/lib/types/auth.ts`
4. Route guards: Add `load` function in `src/routes/+layout.ts` to check auth state
5. Login page: `src/routes/login/+page.svelte`

## Tech Stack
- **Framework:** SvelteKit 2 with Svelte 5
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin, no config file)
- **Language:** TypeScript
- **Build:** Vite, `@sveltejs/adapter-static` (SPA mode with `index.html` fallback)
- **Package manager:** npm
