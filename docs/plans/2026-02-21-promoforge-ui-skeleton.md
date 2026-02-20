# PromoForge UI Skeleton Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold a clean SvelteKit 2 + Svelte 5 + Tailwind CSS v4 frontend skeleton with a CLAUDE.md project map for AI agent navigation.

**Architecture:** SPA-mode SvelteKit app using `adapter-static` with fallback. Minimal routes (dashboard + settings) behind a sidebar+header shell layout. Auth-ready directory structure with no auth implementation yet.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), Tailwind CSS v4 (`@tailwindcss/vite`), TypeScript, Vite

---

### Task 1: Scaffold SvelteKit project

**Files:**
- Create: All SvelteKit boilerplate files via `sv create`

**Step 1: Scaffold with sv create**

Run:
```bash
npx sv create . --types ts --template minimal --no-add-ons --no-install
```

Expected: SvelteKit minimal template created in current directory with TypeScript.

**Step 2: Install dependencies**

Run:
```bash
npm install
```

Expected: `node_modules/` created, `package-lock.json` generated.

**Step 3: Verify dev server starts**

Run:
```bash
npm run dev -- --port 5173 &
sleep 3
curl -s http://localhost:5173 | head -5
kill %1
```

Expected: HTML output from the dev server.

**Step 4: Commit**

```bash
git add -A
git commit -m "scaffold: init SvelteKit project with TypeScript"
```

---

### Task 2: Add Tailwind CSS v4

**Files:**
- Create: `src/app.css`
- Modify: `vite.config.ts`
- Modify: `src/routes/+layout.svelte`

**Step 1: Install Tailwind CSS v4**

Run:
```bash
npm install -D tailwindcss @tailwindcss/vite
```

**Step 2: Configure Vite plugin**

Replace `vite.config.ts` contents with:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	]
});
```

**Step 3: Create `src/app.css`**

```css
@import "tailwindcss";
```

**Step 4: Import CSS in root layout**

Replace `src/routes/+layout.svelte` with:

```svelte
<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}
```

**Step 5: Verify Tailwind works**

Replace `src/routes/+page.svelte` with:

```svelte
<h1 class="text-3xl font-bold text-blue-600">PromoForge</h1>
<p class="text-gray-500">Promotion engine</p>
```

Run dev server briefly to confirm styles apply (no build errors).

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind CSS v4 with Vite plugin"
```

---

### Task 3: Install adapter-static for SPA mode

**Files:**
- Modify: `svelte.config.js`
- Create: `src/routes/+layout.ts`

**Step 1: Install adapter-static**

Run:
```bash
npm install -D @sveltejs/adapter-static
```

**Step 2: Configure svelte.config.js**

Replace `svelte.config.js` with:

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		})
	}
};

export default config;
```

**Step 3: Create layout load to enable SPA mode**

Create `src/routes/+layout.ts`:

```ts
export const prerender = false;
export const ssr = false;
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: configure adapter-static for SPA mode"
```

---

### Task 4: Create directory structure with placeholder files

**Files:**
- Create: `src/lib/components/ui/.gitkeep`
- Create: `src/lib/components/layout/.gitkeep`
- Create: `src/lib/stores/.gitkeep`
- Create: `src/lib/services/.gitkeep`
- Create: `src/lib/types/index.ts`
- Create: `src/lib/utils/index.ts`

**Step 1: Create directories**

Run:
```bash
mkdir -p src/lib/components/ui
mkdir -p src/lib/components/layout
mkdir -p src/lib/stores
mkdir -p src/lib/services
mkdir -p src/lib/types
mkdir -p src/lib/utils
```

**Step 2: Create placeholder files**

Create `src/lib/types/index.ts`:
```ts
// PromoForge type definitions
// Add shared types here as the app grows
```

Create `src/lib/utils/index.ts`:
```ts
// PromoForge utility functions
// Add shared helpers here as the app grows
```

Create `.gitkeep` in empty directories:
```bash
touch src/lib/components/ui/.gitkeep
touch src/lib/components/layout/.gitkeep
touch src/lib/stores/.gitkeep
touch src/lib/services/.gitkeep
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: create lib directory structure for components, stores, services, types, utils"
```

---

### Task 5: Build app shell layout (Sidebar + Header)

**Files:**
- Create: `src/lib/components/layout/Sidebar.svelte`
- Create: `src/lib/components/layout/Header.svelte`
- Create: `src/lib/components/layout/AppShell.svelte`
- Modify: `src/routes/+layout.svelte`

**Step 1: Create Sidebar component**

Create `src/lib/components/layout/Sidebar.svelte`:

```svelte
<script lang="ts">
	const navItems = [
		{ label: 'Dashboard', href: '/', icon: 'home' },
		{ label: 'Settings', href: '/settings', icon: 'settings' }
	];
</script>

<aside class="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
	<div class="flex h-16 items-center border-b border-gray-200 px-6">
		<span class="text-xl font-bold text-gray-900">PromoForge</span>
	</div>
	<nav class="flex-1 space-y-1 px-3 py-4">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
			>
				{item.label}
			</a>
		{/each}
	</nav>
</aside>
```

**Step 2: Create Header component**

Create `src/lib/components/layout/Header.svelte`:

```svelte
<header class="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
	<div class="text-sm text-gray-500">
		<!-- Breadcrumbs or page title slot can go here -->
	</div>
	<div class="flex items-center gap-4">
		<!-- User menu / auth controls will go here -->
	</div>
</header>
```

**Step 3: Create AppShell component**

Create `src/lib/components/layout/AppShell.svelte`:

```svelte
<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import Header from './Header.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen bg-gray-50">
	<Sidebar />
	<div class="flex flex-1 flex-col overflow-hidden">
		<Header />
		<main class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</main>
	</div>
</div>
```

**Step 4: Update root layout to use AppShell**

Replace `src/routes/+layout.svelte` with:

```svelte
<script lang="ts">
	import '../app.css';
	import AppShell from '$lib/components/layout/AppShell.svelte';

	let { children } = $props();
</script>

<AppShell>
	{@render children()}
</AppShell>
```

**Step 5: Remove .gitkeep from layout dir**

```bash
rm src/lib/components/layout/.gitkeep
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app shell layout with Sidebar, Header, and AppShell components"
```

---

### Task 6: Create page skeletons

**Files:**
- Modify: `src/routes/+page.svelte`
- Create: `src/routes/settings/+page.svelte`

**Step 1: Create Dashboard page**

Replace `src/routes/+page.svelte` with:

```svelte
<div>
	<h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
	<p class="mt-1 text-sm text-gray-500">Welcome to PromoForge.</p>
</div>
```

**Step 2: Create Settings page**

Create `src/routes/settings/+page.svelte`:

```svelte
<div>
	<h1 class="text-2xl font-bold text-gray-900">Settings</h1>
	<p class="mt-1 text-sm text-gray-500">Application settings will go here.</p>
</div>
```

**Step 3: Verify navigation works**

Run dev server, visit `/` and `/settings` — both should render inside the app shell.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Dashboard and Settings page skeletons"
```

---

### Task 7: Write CLAUDE.md project map

**Files:**
- Create: `CLAUDE.md`

**Step 1: Write CLAUDE.md**

Create `CLAUDE.md` at project root:

```markdown
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
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md project map for AI agent navigation"
```

---

### Task 8: Final verification

**Step 1: Run type checking**

Run:
```bash
npm run check
```

Expected: No errors.

**Step 2: Run build**

Run:
```bash
npm run build
```

Expected: Build succeeds, output in `build/` directory.

**Step 3: Verify dev server**

Run dev server, confirm:
- `/` shows Dashboard page inside app shell
- `/settings` shows Settings page inside app shell
- Sidebar navigation works
- Tailwind styles apply correctly

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues found during verification"
```
