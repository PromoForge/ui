# Hey API SDK Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install and configure @hey-api/openapi-ts to generate a typed API client from the OpenAPI spec, with a configurable API hostname.

**Architecture:** Generate a full SDK client (types + service functions) from the existing OpenAPI spec at `api/openapi/openapiv3.yaml` into `src/lib/api/generated/`. A thin `src/lib/api/client.ts` wrapper initializes the client with the base URL from `PUBLIC_API_URL` env var. The existing `v1.d.ts` is replaced by the generated output.

**Tech Stack:** @hey-api/openapi-ts (codegen), @hey-api/client-fetch (runtime), SvelteKit `$env/static/public` (config)

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install @hey-api/openapi-ts as dev dependency**

Run:
```bash
bun add -D @hey-api/openapi-ts
```

**Step 2: Install @hey-api/client-fetch as runtime dependency**

Run:
```bash
bun add @hey-api/client-fetch
```

**Step 3: Verify both packages are in package.json**

Run:
```bash
grep -E "hey-api" package.json
```

Expected: Two lines — one in devDependencies, one in dependencies.

---

### Task 2: Create openapi-ts config

**Files:**
- Create: `openapi-ts.config.ts`

**Step 1: Create the config file**

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'api/openapi/openapiv3.yaml',
  output: {
    path: 'src/lib/api/generated',
    format: 'prettier',
  },
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
    '@hey-api/client-fetch',
  ],
});
```

**Step 2: Commit**

```bash
git add openapi-ts.config.ts
git commit -m "feat: add hey-api openapi-ts config"
```

---

### Task 3: Generate the SDK

**Step 1: Run the generator**

Run:
```bash
bunx openapi-ts
```

Expected: Files generated in `src/lib/api/generated/` including `types.gen.ts`, `sdk.gen.ts`, and `index.ts`.

**Step 2: Verify generated output**

Run:
```bash
ls src/lib/api/generated/
```

Expected: Should contain at minimum `types.gen.ts`, `sdk.gen.ts`, `index.ts`.

**Step 3: Delete the old v1.d.ts**

The generated types replace it.

Run:
```bash
rm src/lib/api/v1.d.ts
```

**Step 4: Commit generated files**

```bash
git add src/lib/api/generated/ && git rm src/lib/api/v1.d.ts
git commit -m "feat: generate hey-api SDK from OpenAPI spec"
```

---

### Task 4: Create .env and client config

**Files:**
- Create: `.env`
- Create: `src/lib/api/client.ts`

**Step 1: Create .env file**

```env
PUBLIC_API_URL=http://localhost:8080
```

**Step 2: Create the client configuration**

`src/lib/api/client.ts`:

```ts
import { client } from '@hey-api/client-fetch';
import { PUBLIC_API_URL } from '$env/static/public';

client.setConfig({
  baseUrl: PUBLIC_API_URL,
});

export { client };
```

**Step 3: Import client in root layout to ensure it initializes early**

Modify: `src/routes/+layout.svelte`

Add at the top of the `<script>` block:

```ts
import '$lib/api/client';
```

This ensures the client base URL is configured before any API calls.

**Step 4: Commit**

```bash
git add .env src/lib/api/client.ts src/routes/+layout.svelte
git commit -m "feat: configure API client with PUBLIC_API_URL"
```

---

### Task 5: Update Makefile and CLAUDE.md

**Files:**
- Modify: `Makefile`
- Modify: `CLAUDE.md` (the UI one)

**Step 1: Update Makefile gen-api target**

Replace the existing `gen-api` target:

```makefile
gen-api:
	bunx openapi-ts
```

Update `update-api`:

```makefile
update-api:
	git submodule update --remote api
	$(MAKE) gen-api
```

**Step 2: Add generated dir to .gitignore considerations**

The generated SDK should be committed (not gitignored) so CI doesn't need to regenerate. No change needed to `.gitignore`.

**Step 3: Update CLAUDE.md**

Update the API Types section and project structure to reflect the new setup:

- `src/lib/api/generated/` — generated SDK (do not edit)
- `src/lib/api/client.ts` — client config with base URL
- Remove references to `v1.d.ts`
- Add `PUBLIC_API_URL` env var documentation

**Step 4: Commit**

```bash
git add Makefile CLAUDE.md
git commit -m "docs: update makefile and docs for hey-api SDK"
```

---

### Task 6: Verify build passes

**Step 1: Run type check**

Run:
```bash
make check
```

Expected: No type errors. The generated SDK and client config should be valid.

**Step 2: Run dev server**

Run:
```bash
make dev
```

Expected: Dev server starts without errors. Existing pages still work (they use mock data, not the SDK yet).
