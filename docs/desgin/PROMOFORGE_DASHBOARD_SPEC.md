# PromoForge Admin Dashboard — Design & Build Spec

> **For**: AI coding agent rebuilding and rebranding the Talon.One Campaign Manager dashboard for PromoForge.
> **Reference image**: `quick_entry_image.jpg` — a screenshot of the Talon.One dashboard we're cloning the layout from.

---

## Design Direction

**Tone**: Industrial-utilitarian SaaS with a clean, data-dense feel. Think Stripe Dashboard meets Linear — not playful, not corporate-bloated. Every pixel earns its place. The overall vibe is a *control room* for a promotion engine operator: information-rich, scannable, and calm.

**Typography**: Use a geometric sans-serif with personality — something like **Geist**, **Satoshi**, or **General Sans** (loaded from a CDN). Avoid Inter/Roboto/Arial. Pair with a monospaced font for numbers and stats (e.g., **JetBrains Mono** or **IBM Plex Mono**) so large revenue figures feel precise and engineered.

**Color palette**:
- Background: A warm off-white `#FAFAF9` (not pure gray-50 — slightly warmer) for the dashboard area.
- Side nav + application panel: Pure white `#FFFFFF` with a subtle `1px` right border in `#E8E8E6`.
- Primary accent: A saturated blue `#2563EB` (blue-600) used sparingly — only for CTAs, active nav items, and the environment badge for LIVE.
- Sandbox badge: A muted indigo `#6366F1`.
- Success/running: `#16A34A` (green-600).
- Warning/disabled: `#CA8A04` (yellow-600, not neon amber).
- Danger/expired: `#DC2626` (red-600).
- Revenue chart line: A coral `#F87171` with a soft gradient fill beneath it fading to transparent.
- Donut ring (influence rate): Same coral, on a light gray track.
- KPI card numbers: Rendered in the monospaced font, oversized (32–36px), in near-black `#18181B`.

**Spacing & density**: This is a data-heavy dashboard. Use tight but breathable spacing — 12px/16px/24px rhythm. Cards have 16px internal padding. The layout should feel dense but never cramped.

**Shadows & depth**: Minimal. Cards use a `0 1px 2px rgba(0,0,0,0.05)` shadow — barely there. The side nav has no shadow, just the border. Depth comes from background color contrast between zones, not from drop shadows.

**Motion**: Keep it functional, not decorative. Fade-in the dashboard panel content on application switch (150ms ease). Number counters in KPI cards can animate up on load. Chart draws its line progressively. No bouncing, no spring physics — this is a business tool.

---

## Page Layout — Three Fixed Zones

The entire viewport is divided into three vertical columns, side by side, full height. Nothing collapses. Nothing stacks. The layout is rigid.

### Zone A — Side Navigation (leftmost, ~56px wide, full viewport height)

A narrow icon rail pinned to the left edge. It never scrolls, never changes width.

At the very top sits the **PromoForge logo** — just an icon mark, no wordmark (there isn't room). Below the logo, a vertical stack of navigation items, each rendered as a small icon centered horizontally with a tiny label beneath it (10–11px, uppercase or sentence case). The items from top to bottom are: **Apps**, **Loyalty**, **Giveaways**, **Templates**, **Audiences**. Use Lucide icons or similar.

The active item gets the blue accent color on both icon and label. Inactive items are gray-500. On hover, they lighten slightly.

Pinned to the **bottom** of the nav, separated by vertical space (auto margin), sit two more items: **Account** (gear icon) and **Profile** (person icon).

The background is white. A single-pixel border on the right edge separates it from Zone B.

### Zone B — Application List Panel (~380–400px wide, scrollable)

This sits immediately to the right of the side nav. It has its own vertical scroll if content overflows.

**Top section**: A row containing a search input (placeholder: "Search Applications") on the left and a **"+ Create Application"** button on the right. The button is the primary blue, pill-shaped or rounded, white text. The search input is subtle — light gray background, no heavy border.

**Application cards**: Below the search row, a vertical list of cards, one per application. Each card is a white rounded rectangle with the subtle shadow. Inside each card:

- **Top-left corner**: An environment badge — a small colored pill label saying `LIVE` (green background) or `SANDBOX` (indigo/blue background), white text, uppercase, tiny font.
- **Top-right corner**: Two small icon buttons — a QR code icon and a pencil (edit) icon. These are gray, subtle, only become prominent on card hover.
- **Application name**: Bold, 16px, near-black. This is the dominant element.
- **Campaign count line**: Something like "1,975 CAMPAIGNS" — uppercase label, gray, small.
- **Status breakdown row**: Three inline items with colored dots — running (green dot), disabled (yellow dot), expired (red dot). Each dot is a small filled circle followed by the count and label in small gray text.

Clicking a card selects it (subtle blue left-border highlight or a light blue background wash) and updates everything in Zone C.

**Recently Updated Campaigns section**: Below all the application cards, a section heading reads **"Recently Updated Campaigns"**. Below it, a list of smaller campaign cards. Each campaign card shows:

- A tiny app badge at the top (e.g., a small green square + "KSA PRODUCTION" in caps, small, gray).
- A status dot + the campaign name in medium-weight text.
- A line reading something like "Updated 18/02/2026 by abdulrahman.alm..." in small gray text.

These recent campaigns span all applications — they are not filtered by the selected app.

### Zone C — Account Dashboard (fills all remaining width, scrollable)

This is the main content area. It has its own vertical scroll. The background is the warm off-white, giving it visual separation from the white panels on the left.

**Header area**: At the top, a title reads **"My Account Dashboard"**. Below it, a dismissible info banner (light blue or light gray background with an info icon) says something like "Dashboard updated daily at 11:59pm UTC. Data collected since 12/06/2021." with an × to dismiss.

**Application selector**: A dropdown labeled **"APPLICATION"** (uppercase, small, gray label above it). The dropdown shows the currently selected application name with its environment icon. Changing this re-scopes all dashboard data below.

**Campaign Highlights — KPI Row**: Three stat cards in a horizontal row, evenly spaced. Each card is a white rounded rectangle containing:

- A label at the top: "Running", "Expiring soon", or "Low on budget" — small, gray, with an ℹ️ tooltip icon.
- A large number below: rendered in the monospaced font, 32–36px, near-black. The numbers are the hero of these cards.

These cards have no icons, no decorative elements — just the label, the number, and the info icon. Clean.

**Time Range Selector**: Right-aligned above the chart area, a horizontal segmented button group offering: Custom, Yesterday, 7D, 30D, 3M, 6M, YTD, Max. The active segment has a visible border or filled background. "Custom" opens a date picker. This selection controls the chart and table below.

**Revenue Overview Chart**: A line chart filling the main width of the dashboard (minus the summary card on the right). The Y-axis shows revenue tick marks (0, 300K, 600K, 900K, 1.2M). The X-axis shows dates matching the selected time range. A single line in coral traces the revenue over time, with a soft gradient fill beneath it. Use Recharts for implementation. The chart should be responsive within its container.

**Past 7 Days Summary Card**: Floating to the right of the chart (roughly 200px wide), a compact card showing:

- Heading: "Past 7 Days"
- A small donut chart — the ring is coral-colored showing the influence rate percentage, with the percentage displayed large and bold in the center of the donut.
- Below the donut, two metric rows: "Total Revenue" and "Influenced Revenue", each showing the value and a small green upward arrow with a percentage change (e.g., ↗ 1.80%).

**Revenue Summary Table**: Below the chart, a full-width table with clean horizontal rules (no vertical borders, no zebra striping). Column headers are uppercase, small, gray. The columns are: metric name, YESTERDAY, PAST 7 DAYS, PAST MONTH, the current month name (e.g., DECEMBER), and PAST 3 MONTHS.

Three rows:
1. **Total Revenue** — with a small blue square indicator before the label, and an ℹ️ icon.
2. **Influenced Revenue** — with a small coral/red square indicator, and an ℹ️ icon.
3. **Influence Rate** — plain, showing percentages.

Numbers are locale-formatted with SAR currency where appropriate. Large numbers abbreviate (e.g., 14.45M). Revenue numbers should use the monospaced font for alignment.

---

## Data & Service Architecture (Conceptual)

The agent must build a **service layer** between the UI components and the data. This is the most important architectural decision in the spec.

**The rule is simple**: Components never know where data comes from. They call a hook. The hook calls a service. The service currently returns static mock data. Later, the service will make an HTTP call instead. Only the service internals change — nothing else.

**Three layers**:

1. **Components** — React components that render UI. They receive data from hooks and render it. They never import mock data. They never make HTTP calls.

2. **Hooks** — Custom React hooks (using React Query or SWR) that call service methods and manage loading/error/caching state. They accept parameters like applicationId and timeRange and pass them through to the service.

3. **Services** — Plain TypeScript modules (one per domain: applicationService, campaignService, dashboardService). Each service exposes async methods that return typed data. Right now, those methods return static objects from a mocks folder. Each method has a comment indicating the real API endpoint it will call in the future (e.g., GET /v1/applications/:id/dashboard?range=3M).

**Why this matters**: When the PromoForge Go API is ready, the developer only touches the service files. They swap the mock import for an HTTP call using the base API client. The method signature stays the same. The return type stays the same. Components and hooks are untouched. Zero refactoring.

**Additional service rules**:

- Every service method accepts the parameters it will eventually need (like applicationId, timeRange, limit) even if the mock ignores them. This forces the components and hooks to wire up the parameters correctly now.
- The mock data files live in a separate mocks directory. Services import from mocks. Components never import from mocks.
- TypeScript interfaces for all data shapes (Application, Campaign, DashboardData, RevenueStats, etc.) live in a shared types file. Both services and components reference these types. When the Go API is built, these types should match the API response shapes (with a snake_case to camelCase transformer in the HTTP client).

---

## Interaction States to Build

- **Application selection**: Clicking an app card in Zone B highlights it and refreshes all of Zone C with that app's data.
- **Time range switching**: Clicking a segment in the time range selector updates the chart and table. The selected segment gets an active visual state.
- **Search filtering**: Typing in the application search input filters the card list in real time (client-side filter over the mock data).
- **Info tooltips**: The ℹ️ icons on KPI cards and table rows show a small tooltip on hover explaining the metric.
- **Dismiss banner**: The info banner in the dashboard header disappears when × is clicked (local state, no persistence needed).
- **Hover states**: App cards elevate slightly or show a border change on hover. Nav items shift color. Table rows get a subtle background highlight.

---

## What This Is NOT

- This is not a pixel-perfect clone of Talon.One. It's a rebranding for PromoForge with its own identity.
- The PromoForge logo, brand name, and brand colors replace Talon.One's throughout.
- The data shown is for a Saudi Arabian market context (SAR currency, Arabic-friendly layout considerations, though the UI is in English).
- No authentication, no routing to sub-pages, no campaign detail views — just this single dashboard screen for now.

---

*Reference the uploaded screenshot for spatial relationships, relative sizing, and information hierarchy. Match the layout structure, not the exact pixels.*
