# shadcn-svelte Adoption Design

**Goal:** Replace all 16 hand-rolled UI components with shadcn-svelte equivalents for better animations, accessibility, keyboard navigation, and focus management.

**Approach:** Full replacement — adopt shadcn theming system, install shadcn-svelte, replace every component.

## Component Mapping

| Current Component | shadcn Replacement | Import Count | Notes |
|---|---|---|---|
| Badge | `Badge` | 4 | Map `live`/`sandbox` to shadcn variants |
| Breadcrumb | `Breadcrumb` | 17 | Largest migration surface |
| Button | `Button` | 4 | Map `primary`/`secondary`/`ghost` to shadcn variants |
| Card | `Card` | 9 | Direct replacement |
| FormField | `Label` + wrapper div | 1 | shadcn has no FormField — use Label |
| InfoBanner | `Alert` | 2 | Direct |
| Input | `Input` | 2 | Direct |
| Modal | `Dialog` | 2 | Composition-based API |
| PageActions | Keep custom | 3 | Uses shadcn Button internally |
| SegmentedControl | `ToggleGroup` | 2 | Closest match |
| Select | `Select` | 1 | Composition-based API, biggest API change |
| SlidePanel | `Sheet` | 1 | `side="right"` |
| StatCard | Keep custom | 1 | Uses shadcn Card + Tooltip internally |
| StatusDot | Delete | 0 | Unused |
| Textarea | `Textarea` | 1 | Direct |
| Tooltip | `Tooltip` | 3 | Direct |

## Theme Migration

Adopt shadcn's CSS variable system. Map current custom tokens:

| Current Token | shadcn Variable | Value |
|---|---|---|
| `--color-surface` | `--background` | #FAFAF9 |
| `--color-panel` | `--card` | #FFFFFF |
| `--color-border` | `--border` | #E8E8E6 |
| `--color-primary` | `--primary` | #2563EB |
| `--color-ink` | `--foreground` | #18181B |
| `--color-danger` | `--destructive` | #DC2626 |

Keep as custom extensions (no shadcn equivalent):
- `--color-sandbox` (#6366F1)
- `--color-success` (#16A34A)
- `--color-warning` (#CA8A04)
- `--color-coral` (#F87171)
- `--shadow-card`

## Migration Strategy

1. Install shadcn-svelte CLI and initialize
2. Add all needed shadcn components
3. Migrate theme (app.css) to shadcn variable system
4. Replace components one-by-one, updating all import sites
5. Rebuild app-specific components (PageActions, StatCard) on shadcn primitives
6. Delete unused components (StatusDot) and old hand-rolled files
7. Verify build and type check

## Tech Details

- **shadcn-svelte** fully supports Svelte 5 + Tailwind v4
- Components are copied into the project (you own them), not installed as a dependency
- Built on **Bits UI** (headless accessible primitives)
- Uses `tw-animate-css` for animations (replaces deprecated `tailwindcss-animate`)
