# shadcn-svelte Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all hand-rolled UI components with shadcn-svelte for better animations, accessibility, and keyboard navigation.

**Architecture:** Run shadcn-svelte CLI to initialize and add components (they live in `src/lib/components/ui/<name>/` folders). Update `app.css` to use shadcn's CSS variable theming. Migrate each old component by updating all import sites, then delete old files.

**Tech Stack:** shadcn-svelte (Bits UI), SvelteKit 2, Svelte 5, Tailwind CSS v4, tw-animate-css

---

### Task 1: Initialize shadcn-svelte and add all components

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Modify: `src/app.css`

**Step 1: Run shadcn-svelte init**

```bash
bunx shadcn-svelte@latest init --base-color slate --css src/app.css --no-deps
```

If the CLI asks interactive questions, use these answers:
- Base color: Slate
- Global CSS file: `src/app.css`
- All aliases: defaults (`$lib`, `$lib/components`, `$lib/utils`, `$lib/hooks`, `$lib/components/ui`)

**Step 2: Install dependencies**

```bash
bun add bits-ui clsx tailwind-merge tw-animate-css
```

**Step 3: Add all needed shadcn components**

```bash
bunx shadcn-svelte@latest add button badge card input textarea select dialog sheet tooltip alert breadcrumb label toggle-group -y
```

This creates folders under `src/lib/components/ui/` — one folder per component with an `index.ts` re-export.

**Step 4: Verify the components were added**

```bash
ls src/lib/components/ui/button/ src/lib/components/ui/badge/ src/lib/components/ui/card/ src/lib/components/ui/sheet/
```

Expected: each folder contains `.svelte` files and `index.ts`.

**Step 5: Verify type check**

```bash
make check
```

Note: Expect warnings/errors if the init modified `app.css` in a way that conflicts with existing styles. These are fixed in task 2.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: initialize shadcn-svelte and add all components"
```

---

### Task 2: Migrate theme (app.css)

**Files:**
- Modify: `src/app.css`

**Step 1: Review what shadcn init generated in app.css**

Read `src/app.css` — the init likely added shadcn CSS variables and may have overwritten or conflicted with existing styles.

**Step 2: Rewrite app.css**

The final `app.css` must include:
1. Font imports (existing)
2. `@import "tailwindcss"`
3. `@import "tw-animate-css"` (new — for shadcn animations)
4. `@source` for layerchart (existing)
5. `@custom-variant dark (&:is(.dark *))` (new — dark mode support)
6. `@theme inline` with shadcn variables mapped from our brand colors
7. Custom extensions for colors shadcn doesn't cover

Map our brand colors into shadcn variables (use OKLCH format if the init used it, otherwise hex is fine):

| Our Token | shadcn Variable | Value |
|---|---|---|
| `--color-surface` | `--background` | #FAFAF9 |
| `--color-panel` | `--card`, `--popover` | #FFFFFF |
| `--color-border` | `--border`, `--input` | #E8E8E6 |
| `--color-primary` | `--primary` | #2563EB |
| `--color-ink` | `--foreground`, `--card-foreground`, `--popover-foreground` | #18181B |
| `--color-danger` | `--destructive` | #DC2626 |

Keep these as custom tokens:
- `--color-sandbox: #6366F1`
- `--color-success: #16A34A`
- `--color-warning: #CA8A04`
- `--color-coral: #F87171`
- `--shadow-card: 0 1px 2px rgba(0, 0, 0, 0.05)`

Also keep the old token names as aliases (e.g. `--color-surface: var(--background)`) so existing components still work during migration. These aliases get removed in the final cleanup task.

**Step 3: Update Tailwind class references in existing components**

Search for any components using the old token names directly in Tailwind classes (e.g. `bg-panel`, `text-ink`, `border-border`, `bg-surface`). These should still work via the `@theme` block — verify by running:

```bash
make check
```

Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/app.css
git commit -m "feat: migrate theme to shadcn CSS variable system"
```

---

### Task 3: Migrate Button, Input, Textarea, and FormField

**Files:**
- Modify: All files importing these components (see below)
- Delete after: `src/lib/components/ui/Button.svelte`, `Input.svelte`, `Textarea.svelte`, `FormField.svelte`

**Step 1: Migrate Button**

shadcn Button variant mapping:
- `primary` → `default` (shadcn's default is the primary color)
- `secondary` → `secondary`
- `ghost` → `ghost`

shadcn Button size mapping:
- `sm` → `sm`
- `md` → `default`

Files importing Button:
1. `src/lib/components/ui/SlidePanel.svelte` — will be replaced in task 5, skip for now
2. `src/lib/components/layout/ApplicationPanel.svelte`
3. `src/lib/components/campaigns/CampaignStateCard.svelte`
4. `src/lib/components/campaigns/CloneCampaignModal.svelte` — will be replaced in task 5, skip for now

For each file, change:
```ts
// Old
import Button from '$lib/components/ui/Button.svelte'

// New
import { Button } from '$lib/components/ui/button/index.js'
```

And update variant/size props:
```svelte
<!-- Old -->
<Button variant="primary" size="sm" onclick={fn}>Label</Button>

<!-- New -->
<Button variant="default" size="sm" onclick={fn}>Label</Button>
```

Note: `size="md"` becomes omitted (it's the default). `variant="primary"` becomes `variant="default"` or omitted.

**Step 2: Migrate Input**

Files importing Input:
1. `src/lib/components/layout/ApplicationPanel.svelte`
2. `src/lib/components/applications/CreateApplicationForm.svelte`

Change import:
```ts
// Old
import Input from '$lib/components/ui/Input.svelte'

// New
import { Input } from '$lib/components/ui/input/index.js'
```

shadcn Input supports `bind:value`, `placeholder`, `class` — same API. Also supports `oninput` via standard HTML attribute passthrough.

**Step 3: Migrate Textarea**

Files importing Textarea:
1. `src/lib/components/applications/CreateApplicationForm.svelte`

Change import:
```ts
// Old
import Textarea from '$lib/components/ui/Textarea.svelte'

// New
import { Textarea } from '$lib/components/ui/textarea/index.js'
```

shadcn Textarea supports `bind:value`, `placeholder`, `rows` — same API.

**Step 4: Migrate FormField → Label**

Files importing FormField:
1. `src/lib/components/applications/CreateApplicationForm.svelte`

Replace FormField usage with Label + wrapper div:

```svelte
<!-- Old -->
<FormField label="Name" required>
  <Input placeholder="Application name" bind:value={name} />
</FormField>

<!-- New -->
<div class="flex flex-col gap-1.5">
  <Label class="text-sm font-medium">
    Name
  </Label>
  <Input placeholder="Application name" bind:value={name} />
</div>
```

For optional fields, add the "(optional)" text inline:
```svelte
<div class="flex flex-col gap-1.5">
  <Label class="text-sm font-medium">
    Description <span class="font-normal text-muted-foreground">(optional)</span>
  </Label>
  <Textarea placeholder="Describe this application" bind:value={description} />
</div>
```

Import:
```ts
import { Label } from '$lib/components/ui/label/index.js'
```

**Step 5: Delete old component files**

```bash
rm src/lib/components/ui/Button.svelte src/lib/components/ui/Input.svelte src/lib/components/ui/Textarea.svelte src/lib/components/ui/FormField.svelte
```

**Step 6: Verify type check**

```bash
make check
```

Expected: Errors in `SlidePanel.svelte` (still imports old Button) and `CloneCampaignModal.svelte` (still imports old Button). These are replaced in task 5. If those are the only errors, proceed.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: migrate Button, Input, Textarea, FormField to shadcn-svelte"
```

---

### Task 4: Migrate Badge and Card

**Files:**
- Modify: All files importing Badge (4) and Card (9)
- Delete after: `src/lib/components/ui/Badge.svelte`, `src/lib/components/ui/Card.svelte`

**Step 1: Customize shadcn Badge for live/sandbox variants**

Read the generated `src/lib/components/ui/badge/badge.svelte` to understand the variant system.

Add custom `live` and `sandbox` variants to the badge's variant config. The shadcn badge uses a `variants` helper (likely via `class-variance-authority` pattern or inline). Add:

```ts
live: 'bg-success text-white',
sandbox: 'bg-sandbox text-white',
```

**Step 2: Migrate Badge imports**

Files importing Badge:
1. `src/lib/components/dashboard/ApplicationCard.svelte`
2. `src/lib/components/layout/ApplicationContextPanel.svelte`
3. `src/lib/components/layout/CampaignContextPanel.svelte`
4. `src/routes/applications/[id]/+page.svelte`

Change import in each:
```ts
// Old
import Badge from '$lib/components/ui/Badge.svelte'

// New
import { Badge } from '$lib/components/ui/badge/index.js'
```

Usage stays the same since we added the `live`/`sandbox` variants. The `label` prop becomes children:

```svelte
<!-- Old -->
<Badge variant="live" label="LIVE" />

<!-- New -->
<Badge variant="live">LIVE</Badge>
```

**Step 3: Migrate Card**

Files importing Card:
1. `src/lib/components/campaigns/CampaignDetailsCard.svelte`
2. `src/lib/components/campaigns/CampaignBudgetsCard.svelte`
3. `src/lib/components/campaigns/CampaignStateCard.svelte`
4. `src/lib/components/campaigns/CampaignScheduleCard.svelte`
5. `src/lib/components/campaigns/CampaignRulesCard.svelte`

Change import:
```ts
// Old
import Card from '$lib/components/ui/Card.svelte'

// New
import * as Card from '$lib/components/ui/card/index.js'
```

Update usage — old Card was a simple wrapper, shadcn Card uses `Card.Root`:

```svelte
<!-- Old -->
<Card class={className}>
  <h3>Title</h3>
  <p>Content</p>
</Card>

<!-- New -->
<Card.Root class={className}>
  <Card.Content>
    <h3>Title</h3>
    <p>Content</p>
  </Card.Content>
</Card.Root>
```

Note: Use `Card.Content` for the body. If the card has a clear title/description, use `Card.Header`/`Card.Title`/`Card.Description`. For simple wrapper usage, `Card.Root` + `Card.Content` is sufficient.

**Step 4: Delete old files**

```bash
rm src/lib/components/ui/Badge.svelte src/lib/components/ui/Card.svelte
```

**Step 5: Verify type check**

```bash
make check
```

Expected: 0 new errors (StatCard.svelte imports Tooltip not Card — unaffected).

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: migrate Badge and Card to shadcn-svelte"
```

---

### Task 5: Migrate Modal → Dialog, SlidePanel → Sheet, Select

**Files:**
- Modify: `CloneCampaignModal.svelte`, `CreateApplicationForm.svelte`
- Delete after: `src/lib/components/ui/Modal.svelte`, `src/lib/components/ui/SlidePanel.svelte`, `src/lib/components/ui/Select.svelte`

**Step 1: Migrate CloneCampaignModal to use Dialog**

Read `src/lib/components/campaigns/CloneCampaignModal.svelte` first.

Replace Modal with Dialog:

```svelte
<!-- Old -->
<Modal bind:open title="Copy Campaign">
  <div class="space-y-4">
    <!-- form content -->
    <div class="flex justify-end gap-2">
      <Button variant="secondary" onclick={() => open = false}>Cancel</Button>
      <Button variant="primary" onclick={handleConfirm}>Confirm</Button>
    </div>
  </div>
</Modal>

<!-- New -->
<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Copy Campaign</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-4">
      <!-- form content (same) -->
    </div>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => open = false}>Cancel</Button>
      <Button onclick={handleConfirm}>Confirm</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

Update imports:
```ts
// Old
import Modal from '$lib/components/ui/Modal.svelte'
import Button from '$lib/components/ui/Button.svelte'

// New
import * as Dialog from '$lib/components/ui/dialog/index.js'
import { Button } from '$lib/components/ui/button/index.js'
```

**Step 2: Migrate CreateApplicationForm to use Sheet and shadcn Select**

Read `src/lib/components/applications/CreateApplicationForm.svelte` first.

Replace SlidePanel with Sheet:

```svelte
<!-- Old -->
<SlidePanel bind:open title="Create an Application" submitLabel="Create Application" onsubmit={handleSubmit} {loading}>
  <div class="flex flex-col gap-5">
    <!-- form fields -->
  </div>
</SlidePanel>

<!-- New -->
<Sheet.Root bind:open>
  <Sheet.Content side="right">
    <Sheet.Header>
      <Sheet.Title>Create an Application</Sheet.Title>
    </Sheet.Header>
    <div class="flex-1 overflow-y-auto px-6 py-6">
      <div class="flex flex-col gap-5">
        {#if error}
          <div class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        {/if}
        <!-- form fields (migrated to shadcn Select below) -->
      </div>
    </div>
    <Sheet.Footer>
      <Sheet.Close>Cancel</Sheet.Close>
      <Button onclick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : 'Create Application'}
      </Button>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
```

Replace each Select usage with shadcn Select (composition API):

```svelte
<!-- Old -->
<Select bind:value={currency} options={currencyOptions} />

<!-- New -->
<Select.Root type="single" bind:value={currency}>
  <Select.Trigger class="w-full">
    {currencyOptions.find(o => o.value === currency)?.label ?? 'Select...'}
  </Select.Trigger>
  <Select.Content>
    {#each currencyOptions as option (option.value)}
      <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
```

Repeat for all Select usages: `currency`, `timezone`, `caseSensitivity`, `environment`.

Update imports:
```ts
// Old
import SlidePanel from '$lib/components/ui/SlidePanel.svelte'
import Select from '$lib/components/ui/Select.svelte'
import FormField from '$lib/components/ui/FormField.svelte'
import Input from '$lib/components/ui/Input.svelte'
import Textarea from '$lib/components/ui/Textarea.svelte'

// New
import * as Sheet from '$lib/components/ui/sheet/index.js'
import * as Select from '$lib/components/ui/select/index.js'
import { Label } from '$lib/components/ui/label/index.js'
import { Input } from '$lib/components/ui/input/index.js'
import { Textarea } from '$lib/components/ui/textarea/index.js'
import { Button } from '$lib/components/ui/button/index.js'
```

**Step 3: Delete old files**

```bash
rm src/lib/components/ui/Modal.svelte src/lib/components/ui/SlidePanel.svelte src/lib/components/ui/Select.svelte
```

**Step 4: Verify type check**

```bash
make check
```

Expected: 0 errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: migrate Modal, SlidePanel, Select to shadcn Dialog/Sheet/Select"
```

---

### Task 6: Migrate Tooltip, Breadcrumb, InfoBanner, SegmentedControl

**Files:**
- Modify: `src/routes/+layout.svelte` (add Tooltip.Provider)
- Modify: All files importing Tooltip (2), Breadcrumb (17), InfoBanner (2), SegmentedControl (2)
- Delete after: old component files

**Step 1: Add Tooltip.Provider to root layout**

In `src/routes/+layout.svelte`, wrap the app in `Tooltip.Provider`:

```svelte
<script lang="ts">
  import '$lib/api/client';
  import '../app.css'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

  let { children } = $props()
</script>

<Tooltip.Provider>
  {@render children()}
</Tooltip.Provider>
```

**Step 2: Migrate Tooltip**

Files importing Tooltip:
1. `src/lib/components/ui/StatCard.svelte`
2. `src/lib/components/dashboard/RevenueSummaryTable.svelte`

Change import and usage:
```ts
// Old
import Tooltip from '$lib/components/ui/Tooltip.svelte'

// New
import * as Tooltip from '$lib/components/ui/tooltip/index.js'
```

```svelte
<!-- Old -->
<Tooltip text={tooltip}>
  <Info size={14} class="text-gray-400" />
</Tooltip>

<!-- New -->
<Tooltip.Root>
  <Tooltip.Trigger>
    <Info size={14} class="text-gray-400" />
  </Tooltip.Trigger>
  <Tooltip.Content>
    <p>{tooltip}</p>
  </Tooltip.Content>
</Tooltip.Root>
```

**Step 3: Migrate Breadcrumb (17 files)**

This is the biggest migration by file count. Every file uses the same pattern:

```ts
// Old
import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte'
```

```svelte
<!-- Old usage pattern (all 17 files) -->
<Breadcrumb items={breadcrumbItems} />
```

Where `breadcrumbItems` is `Array<{ label: string; href?: string }>`.

The shadcn Breadcrumb uses composition API. To minimize changes across 17 files, **create a wrapper component** that preserves the old `items` prop API:

Create `src/lib/components/ui/app-breadcrumb.svelte`:

```svelte
<script lang="ts">
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js'

  let {
    items,
    class: className = ''
  }: {
    items: { label: string; href?: string }[]
    class?: string
  } = $props()
</script>

<Breadcrumb.Root class={className}>
  <Breadcrumb.List>
    {#each items as item, i (i)}
      {#if i > 0}
        <Breadcrumb.Separator />
      {/if}
      <Breadcrumb.Item>
        {#if item.href}
          <Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
        {:else}
          <Breadcrumb.Page>{item.label}</Breadcrumb.Page>
        {/if}
      </Breadcrumb.Item>
    {/each}
  </Breadcrumb.List>
</Breadcrumb.Root>
```

Then in all 17 files, just change the import:
```ts
// Old
import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte'

// New
import Breadcrumb from '$lib/components/ui/app-breadcrumb.svelte'
```

No other changes needed — the wrapper preserves the `items` prop API.

**Step 4: Migrate InfoBanner → Alert**

Files importing InfoBanner:
1. `src/routes/applications/[id]/+page.svelte`
2. `src/routes/applications/[id]/dashboard/+page.svelte`

Replace with Alert:
```svelte
<!-- Old -->
<InfoBanner message="Dashboard updated daily..." class="mt-4" />

<!-- New -->
<Alert.Root class="mt-4">
  <Info class="size-4" />
  <Alert.Description>Dashboard updated daily at 11:59pm UTC. Data collected since 12/06/2021.</Alert.Description>
</Alert.Root>
```

Note: InfoBanner was dismissible (had an X button). If dismissibility is needed, wrap in a `{#if visible}` block with local state. If not needed, skip it.

Import:
```ts
import * as Alert from '$lib/components/ui/alert/index.js'
import { Info } from 'lucide-svelte'
```

**Step 5: Migrate SegmentedControl → ToggleGroup**

Files importing SegmentedControl:
1. `src/routes/applications/[id]/+page.svelte`
2. `src/routes/applications/[id]/dashboard/+page.svelte`

```svelte
<!-- Old -->
<SegmentedControl
  options={timeRangeOptions}
  selected={dashboardStore.timeRange}
  onchange={handleTimeRangeChange}
/>

<!-- New -->
<ToggleGroup.Root
  type="single"
  variant="outline"
  size="sm"
  value={dashboardStore.timeRange}
  onValueChange={handleTimeRangeChange}
>
  {#each timeRangeOptions as option (option.value)}
    <ToggleGroup.Item value={option.value} aria-label={option.label}>
      {option.label}
    </ToggleGroup.Item>
  {/each}
</ToggleGroup.Root>
```

Import:
```ts
import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js'
```

Note: Check the exact prop name for the value change callback — it may be `onValueChange` or handled via `bind:value`. Read the generated toggle-group component to confirm.

**Step 6: Delete old files**

```bash
rm src/lib/components/ui/Tooltip.svelte src/lib/components/ui/Breadcrumb.svelte src/lib/components/ui/InfoBanner.svelte src/lib/components/ui/SegmentedControl.svelte
```

**Step 7: Verify type check**

```bash
make check
```

Expected: 0 errors, 0 warnings.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: migrate Tooltip, Breadcrumb, InfoBanner, SegmentedControl to shadcn-svelte"
```

---

### Task 7: Rebuild StatCard and PageActions, final cleanup

**Files:**
- Modify: `src/lib/components/ui/StatCard.svelte` (rebuild on shadcn Card + Tooltip)
- Modify: `src/lib/components/ui/PageActions.svelte` (rebuild on shadcn Button)
- Delete: `src/lib/components/ui/StatusDot.svelte`
- Modify: `src/app.css` (remove old token aliases)

**Step 1: Rebuild StatCard**

Read `src/lib/components/ui/StatCard.svelte` first. Update to use shadcn Card and Tooltip:

```svelte
<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { Info } from 'lucide-svelte'

  let {
    label,
    value,
    tooltip = '',
    class: className = ''
  }: {
    label: string
    value: number
    tooltip?: string
    class?: string
  } = $props()
</script>

<Card.Root class={className}>
  <Card.Content class="p-4">
    <div class="flex items-center gap-1 text-xs text-muted-foreground">
      {label}
      {#if tooltip}
        <Tooltip.Root>
          <Tooltip.Trigger>
            <Info size={14} class="text-muted-foreground" />
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>{tooltip}</p>
          </Tooltip.Content>
        </Tooltip.Root>
      {/if}
    </div>
    <div class="font-mono text-3xl font-semibold text-foreground">
      {value.toLocaleString()}
    </div>
  </Card.Content>
</Card.Root>
```

**Step 2: Rebuild PageActions**

Read `src/lib/components/ui/PageActions.svelte` first. Update to use shadcn Button:

```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { ExternalLink, ChevronDown } from 'lucide-svelte'
</script>

<div class="flex items-center gap-2">
  <Button variant="link" class="gap-1 text-primary">
    <ExternalLink size={14} />
    Documentation
  </Button>
  <Button variant="outline" class="gap-1">
    Manage Campaign Data
    <ChevronDown size={14} />
  </Button>
</div>
```

**Step 3: Delete StatusDot (unused)**

```bash
rm src/lib/components/ui/StatusDot.svelte
```

**Step 4: Remove old CSS token aliases from app.css**

If task 2 added backward-compatible aliases like `--color-surface: var(--background)`, search the codebase for any remaining usage of old tokens:

```bash
grep -rn "color-surface\|color-panel\|color-ink\|bg-panel\|text-ink\|bg-surface" src/ --include="*.svelte" --include="*.ts"
```

For any remaining usages, replace with shadcn equivalents:
- `bg-panel` → `bg-card`
- `bg-surface` → `bg-background`
- `text-ink` → `text-foreground`
- `border-border` → `border-border` (same in shadcn)
- `shadow-card` → `shadow-sm` (or keep custom)

Then remove the old aliases from `app.css`.

**Step 5: Verify type check and build**

```bash
make check
make build
```

Expected: 0 errors, 0 warnings. Build succeeds.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: rebuild StatCard/PageActions on shadcn, remove old components and token aliases"
```
