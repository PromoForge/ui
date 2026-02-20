# PromoForge UI Skeleton Design

**Date:** 2026-02-21
**Status:** Approved

## Overview

PromoForge is a promotion engine (similar to Talon.One). This document covers the initial frontend skeleton — a clean, well-structured SvelteKit project that other agents and developers can easily extend.

## Tech Stack

- **Svelte 5** with runes (`$state`, `$derived`, `$props`)
- **SvelteKit 2** with `@sveltejs/adapter-static` (SPA mode, frontend-only)
- **TypeScript** throughout
- **Tailwind CSS** for styling
- **Vite** as build tool

## Project Structure

```
ui/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/            # Base UI primitives (Button, Card, Input, etc.)
│   │   │   └── layout/        # Shell components (Sidebar, Header)
│   │   ├── stores/            # Svelte 5 rune-based state
│   │   ├── services/          # API layer (stubs for now)
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Helper functions
│   ├── routes/
│   │   ├── +layout.svelte     # App shell (sidebar + header)
│   │   ├── +page.svelte       # Dashboard (placeholder)
│   │   └── settings/
│   │       └── +page.svelte   # Settings (placeholder)
│   ├── app.html
│   └── app.css                # Tailwind directives + global styles
├── static/
├── CLAUDE.md                  # Project map for AI agents
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

## Key Decisions

1. **Svelte 5 runes only** — no legacy `writable`/`readable` stores API
2. **Auth-ready, not auth-implemented** — `services/` and `stores/` have placeholder structure for auth; route guards via layout `load` functions when needed
3. **SPA mode** — `adapter-static` with fallback since this is frontend-only
4. **Minimal routes** — `/` (dashboard) and `/settings` only; easy to extend
5. **CLAUDE.md** — documents every directory purpose and conventions for AI agents

## Adding New Features (conventions)

- **New page**: Add `src/routes/<name>/+page.svelte`
- **New component**: Add to `src/lib/components/ui/` (primitives) or `src/lib/components/layout/` (shell)
- **New service**: Add to `src/lib/services/<name>.ts`
- **New type**: Add to `src/lib/types/<name>.ts`
- **New store**: Add to `src/lib/stores/<name>.svelte.ts` (use `.svelte.ts` for rune-based modules)
