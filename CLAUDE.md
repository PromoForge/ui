# PromoForge UI

Promotion engine frontend built with SvelteKit 2, Svelte 5, Tailwind CSS v4, and TypeScript.

## Commands

- `make dev` — Start dev server (port 5173)
- `make build` — Production build
- `make check` — Run svelte-check for type errors
- `make gen-api` — Regenerate TypeScript SDK from OpenAPI spec
- `make update-api` — Pull latest api submodule and regenerate SDK
- `make format` — Run prettier on src/
- `make clean` — Remove build artifacts

## Environment Variables

- `PUBLIC_API_URL` — API base URL (e.g. `http://localhost:8080`). Set in `.env` file.

## Project Structure

```
api/                         # Git submodule → github.com/PromoForge/api (OpenAPI specs)
src/
├── lib/
│   ├── api/
│   │   ├── generated/       # Generated hey-api SDK (do not edit)
│   │   └── client.ts        # Client config — sets base URL from PUBLIC_API_URL
│   ├── components/
│   │   ├── ui/              # shadcn-svelte components + custom primitives
│   │   └── layout/          # App shell components (Sidebar, Header, AppShell)
│   ├── stores/              # Svelte 5 rune-based state (use .svelte.ts extension)
│   ├── services/            # API/backend service layer
│   ├── types/               # Shared TypeScript type definitions
│   │   └── index.ts         # Re-exports all types
│   └── utils/               # Pure utility/helper functions
│       └── index.ts         # Re-exports all utils
├── routes/
│   ├── +layout.svelte       # Root layout — wraps all pages in AppShell
│   ├── +layout.ts           # SPA mode config (ssr=false, prerender=false)
│   ├── +page.svelte         # Dashboard page (/)
│   └── settings/
│       └── +page.svelte     # Settings page (/settings)
├── app.css                  # Tailwind CSS v4 entry point
└── app.html                 # HTML template
```

## API SDK

Typed API client is auto-generated from the PromoForge OpenAPI v3 spec using `@hey-api/openapi-ts`.

- **Generated SDK:** `src/lib/api/generated/` — do NOT edit manually
- **Client config:** `src/lib/api/client.ts` — configures base URL from `PUBLIC_API_URL`
- **Source:** `api/openapi/openapiv3.yaml` (from the `api` git submodule)
- **Config:** `openapi-ts.config.ts`
- **Generator:** `@hey-api/openapi-ts` — run `make gen-api` to regenerate
- **Update workflow:** When protos change in the `api` repo, run `make update-api` to pull latest spec and regenerate SDK
- **Usage:** Import SDK functions from `$lib/api/generated` and types from `$lib/api/generated/types.gen`

## Conventions

### Adding a new page
1. Create `src/routes/<page-name>/+page.svelte`
2. Add nav entry in `src/lib/components/layout/Sidebar.svelte` navItems array

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

## UI Components (shadcn-svelte)

UI primitives are provided by **shadcn-svelte** (built on **Bits UI**). Components live in `src/lib/components/ui/` and are owned by the project (not a node_modules dependency).

- **Add a component:** `bunx shadcn-svelte@latest add <component-name>`
- **Available components:** https://shadcn-svelte.com/docs/components
- **Theming:** CSS variables in `app.css` using shadcn's convention (`--background`, `--foreground`, `--primary`, etc.)
- **Animations:** Provided by `tw-animate-css`

### Adding a new UI component
1. First check if shadcn-svelte has it: `bunx shadcn-svelte@latest add <name>`
2. If not available in shadcn, create `src/lib/components/ui/<ComponentName>.svelte` and build on top of shadcn primitives (Button, Card, etc.)
3. Use Svelte 5 runes: `$props()`, `$state()`, `$derived()`

### Custom extensions (not from shadcn)
App-specific components that build on shadcn primitives:
- `PageActions` — common page header actions
- `StatCard` — KPI display card (uses shadcn Card + Tooltip)

## Tech Stack
- **Framework:** SvelteKit 2 with Svelte 5
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin, no config file)
- **UI Components:** shadcn-svelte (Bits UI)
- **Language:** TypeScript
- **Build:** Vite, `@sveltejs/adapter-static` (SPA mode with `index.html` fallback)
- **Package manager:** bun
