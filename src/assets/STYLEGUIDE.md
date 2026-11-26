# EventGenius UI style guide

Short, practical rules for building pages on the shared foundation
(`src/assets/main.css`, `tailwind.config.js`). Read this before restyling a page.

## Direction

Modern, calm and information-rich. Solid surfaces, 1px hairline borders, subtle
neutral shadows, clear type hierarchy, real photography where it helps.
Neutrals do most of the work; emerald is the brand accent.

### Never
- Gradients of any kind: `bg-gradient-*`, `from-*/via-*/to-*`, `linear-gradient`,
  `radial-gradient`, gradient text (`background-clip: text`).
- Glows or blurred colour blobs (`blur-[80px]` circles), coloured shadows
  (`shadow-primary-500/20`, `rgba(16,185,129,.3)` shadows), animated
  pixel/particle backgrounds, glassy `backdrop-blur` panels, sparkle icons/emoji.
- White text on `primary-500` / `#10B981` (fails contrast). Use `brand-strong`.
- Hover "lift" (`-translate-y-*`) on everything. Use a border or shadow change.

Check before committing:
`grep -rnE "gradient|from-[a-z]+-[0-9]|via-|blur-\[|shadow-[a-z]+-[0-9]+/[0-9]+" src`
(the only allowed hits are the range-slider fills in `components/admin/search/*`).

## Tokens

Defined in `main.css` on `:root` and `.dark`. Tailwind colours below switch
with the theme automatically, so **you do not need `dark:` variants** when using them.

| Purpose | Tailwind | CSS var |
|---|---|---|
| Page background | `bg-canvas` | `--canvas` |
| Card / panel / input | `bg-surface` | `--surface` |
| Menus, popovers | `bg-surface-raised` | `--surface-raised` |
| Table head, wells, tracks | `bg-surface-sunken` | `--surface-sunken` |
| Hover row / item | `bg-surface-hover` | `--surface-hover` |
| Hairline border | `border-line` | `--line` |
| Input border (3:1) | `border-line-strong` | `--line-strong` |
| Main text | `text-ink` | `--ink` |
| Body / secondary text | `text-ink-secondary` | `--ink-secondary` |
| Meta, hints, captions | `text-ink-muted` | `--ink-muted` |
| Brand fill (buttons) | `bg-brand-strong` + `text-white` | `--brand-strong` |
| Brand text / links | `text-brand-text` | `--brand-text` |
| Brand tint background | `bg-brand-soft` | `--brand-soft` |
| Decorative brand (icons, dots, charts only) | `text-brand`, `bg-brand` | `--brand` |
| Status | `text-success-text bg-success-soft border-success-line` (also `warning`, `danger`, `info`, `neutral`) | `--success-text` … |

Opacity works: `bg-surface/90`, `border-line/60`.

Legacy scales still work: `warm-*` (stone neutrals), `primary-*` (note:
**600+ are one step darker** than Tailwind's emerald, 600 = `#047857`),
`accent`/`coral` (now theme-aware and darker so text passes).
Prefer the semantic tokens in new code.

**Radius:** buttons/inputs `rounded-lg` (8px), cards `rounded-xl` (12px),
large media/modals `rounded-xl`/`rounded-2xl`. Avoid `rounded-3xl` pills on cards.
**Shadow:** `shadow-xs` (cards), `shadow-sm`, `shadow-md` (hover),
`shadow-lg` (menus), `shadow-float` (modals). All neutral.
**Fonts:** `font-display` (Bricolage Grotesque, h1/h2 get it automatically),
`font-sans` (DM Sans, default), `font-mono` (DM Mono, booking refs/IDs).
Use `num` / `tabular-nums` for figures in tables and stats.
**Z-index:** `z-sticky` 20, `z-nav` 30, `z-drawer` 40, `z-modal` 50, `z-toast` 60.

## Spacing rules
- 4px grid. Page sections `space-y-6` (portal) / `py-16 lg:py-20` (public).
- Card padding `p-5` (`.card-body`), compact `p-4`. Grid gaps `gap-4` (cards), `gap-6` (sections).
- Portal content is already padded and capped at 1440px by `App.vue`. Do not add outer padding.
- Public pages: wrap content in `.content-container`.
- Touch targets ≥ 44px on mobile (buttons/inputs do this automatically on touch screens).
- Test at 360px: no horizontal page scroll. Wide tables go inside `.table-wrapper`.

## Component classes

### Buttons
```html
<button class="btn-primary">Book venue</button>
<button class="btn-secondary">Cancel</button>
<button class="btn-outline">View bookings</button>
<button class="btn-ghost">Skip</button>
<button class="btn-danger">Delete</button>
<button class="btn-danger-ghost">Remove</button>
<!-- sizes / modifiers -->
<button class="btn-primary btn-sm">…</button>  <button class="btn-primary btn-lg btn-block">…</button>
<button class="btn-icon" aria-label="Edit"><AppIcon icon="edit" class="w-4 h-4" /></button>
```
One primary button per view area. Icons in buttons are `w-4 h-4`.

### Page header (portal pages)
```html
<header class="page-header">
  <div>
    <p class="page-eyebrow">Bookings</p>            <!-- optional -->
    <h1 class="page-title">All bookings</h1>
    <p class="page-subtitle">34 waiting for your review</p>
  </div>
  <div class="page-header-actions">
    <button class="btn-secondary"><AppIcon icon="download" class="w-4 h-4" />Export</button>
    <RouterLink to="/shop/venues/create" class="btn-primary"><AppIcon icon="plus" class="w-4 h-4" />Add venue</RouterLink>
  </div>
</header>
```
The top bar already shows a breadcrumb (portal › page); the page owns the `h1`.

### Cards
```html
<section class="card">
  <div class="card-header">
    <div><h2 class="card-title">Recent bookings</h2><p class="card-subtitle">Last 30 days</p></div>
    <RouterLink to="…" class="btn-ghost btn-sm">View all <AppIcon icon="chevron-right" class="w-4 h-4" /></RouterLink>
  </div>
  <div class="card-body">…</div>
  <div class="card-footer">…</div>   <!-- optional, sunken -->
</section>
```
`card-hover` for clickable cards. `panel-sunken` for an inset well.
Label/value lists: `<dl><div class="dl-row"><dt>Guests</dt><dd>450</dd></div></dl>`.

### Stat cards (label, value, delta, helper)
```html
<div class="stat-card !items-start">
  <span class="icon-chip tone-brand"><AppIcon icon="calendar-check" class="w-5 h-5" /></span>
  <div class="min-w-0">
    <p class="stat-label">Confirmed bookings</p>
    <p class="stat-value">56</p>
    <p class="stat-meta">
      <span class="stat-delta-up"><AppIcon icon="trending-up" class="w-3 h-3" />12%</span>
      vs last month
    </p>
  </div>
</div>
```
Tones: `tone-brand | tone-success | tone-warning | tone-danger | tone-info | tone-neutral`.
Deltas: `stat-delta-up | stat-delta-down | stat-delta-flat`. Long money values
(e.g. `PKR 377.6M`) need `text-xl` or a shorter format so they don't overflow.

### Tables
```html
<div class="card overflow-hidden">
  <div class="table-wrapper max-h-[560px]">           <!-- max-h makes the header sticky -->
    <table class="data-table is-striped">
      <thead><tr>
        <th>Booking</th><th>Venue</th><th>Status</th><th class="cell-num">Amount</th><th class="cell-actions"></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="ref text-brand-text">BK-9A27…</td>
          <td class="cell-primary">Mughal Garden Marquee</td>
          <td><span :class="statusBadgeClass(b.status)">{{ statusLabel(b.status) }}</span></td>
          <td class="cell-num">PKR 1,073,100</td>
          <td class="cell-actions"><button class="btn-ghost btn-sm">View</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```
Modifiers: `is-striped`, `is-compact`. Numbers right-aligned (`cell-num`).
On phones prefer a stacked card list over a wide table where the table is the main content.

### Status badges — one colour per status
```ts
import { statusBadgeClass, statusLabel } from '@/lib/status'
```
| status | class | colour |
|---|---|---|
| pending | `badge-pending` | amber |
| confirmed / approved / active | `badge-confirmed` | emerald |
| completed | `badge-completed` | blue |
| cancelled / inactive | `badge-cancelled` | stone |
| rejected / suspended / failed | `badge-rejected` | red |
| paid | `badge-paid` | teal |
| unpaid / partially paid | `badge-unpaid` | orange |
| refunded | `badge-refunded` | violet |

Generic badges still exist: `badge` / `badge-warm` / `badge-neutral` (grey),
`badge-primary`/`badge-success`, `badge-accent`/`badge-warning`,
`badge-coral`/`badge-danger`, `badge-info`. Small counts: `count-badge`.

### Control sizes (one scale for everything)

| size | height | token / utility | classes |
|---|---|---|---|
| sm | 32px | `--control-h-sm`, `h-control-sm` | `btn-sm`, `btn-icon-sm`, `control-sm` |
| md (default) | 40px, **44px on touch** | `--control-h-md`, `h-control-md` | `btn-*`, `btn-icon`, `form-input`, `form-select`, `segmented` |
| lg | 48px | `--control-h-lg`, `h-control-lg` | `btn-lg`, `btn-icon-lg`, `control-lg` |

Inputs, selects, buttons, square icon buttons, segmented controls and input
add-ons all read `--control-h`, so they line up. **Controls in the same row use
the same size** — never mix a 40px input with a 32px button; never set one-off
heights (`h-[42px]`, `!min-h-[36px]`, `py-2.5` on buttons). Put `control-sm` /
`control-lg` on a `form-input`, `form-select`, `segmented` or `.control` box to
resize it. Buttons inset inside a field are 8px shorter with a 4px gap.
Icon-only buttons are at least 32px (`btn-icon-sm`); text-like buttons use
`btn-link` (32px hit area). `btn-secondary btn-icon` = bordered square icon button.

Badges: md 24px (default) and `badge-sm` 20px (`--badge-h-md/sm`); `count-badge` is 20px.
Radius: controls `--control-radius` (8px, 6px for sm). Focus: `--control-ring`.

### Forms — use the components

**Build every form with `src/components/forms`** (`FormField`, `TextInput`,
`PasswordInput`, `NumberInput`, `CurrencyInput`, `PhoneInput`, `SelectInput`,
`Combobox`, `DatePicker`, `TimePicker`, `CheckboxGroup`, `RadioCards`,
`FileUpload`, `FormActions`, …). They handle labels, hints, errors, ids,
`aria-describedby`, `aria-invalid`, sizes and dark mode. Docs:
`src/components/forms/README.md`; live gallery: `/dev/forms`.

```vue
<FormField label="Guests" required :error="errors.guests" hint="Between 50 and 1,000.">
  <NumberInput v-model="form.guests" :min="50" :max="1000" :step="10" />
</FormField>
<FormActions sticky form-id="venue-form" :saving="saving" :dirty="dirty" cancel-label="Cancel" />
```

The raw classes below still exist for the rare case a component doesn't fit:
```html
<div>
  <label for="guests" class="form-label">Guests <span class="req">*</span></label>
  <input id="guests" class="form-input" type="number" :aria-invalid="!!errors.guests" aria-describedby="guests-hint" />
  <p v-if="errors.guests" class="form-error">{{ errors.guests[0] }}</p>
  <p v-else id="guests-hint" class="form-hint">Between 50 and 1,000.</p>
</div>
<select class="form-select">…</select>
<textarea class="form-textarea" rows="4"></textarea>
<input type="checkbox" class="form-check" />
```
`aria-invalid="true"` (or `.is-invalid`) gives the red border.

### Tabs and segmented controls
```html
<nav class="tabs" role="tablist">
  <button role="tab" class="tab" :aria-selected="tab==='all'">All <span class="tab-count">120</span></button>
  <button role="tab" class="tab" :aria-selected="tab==='pending'">Pending</button>
</nav>
<div class="segmented"><button :aria-pressed="view==='grid'">Grid</button><button :aria-pressed="view==='list'">List</button></div>
```

### Alerts, empty states, loading
```html
<div class="alert-warning" role="status">
  <AppIcon icon="alert-triangle" class="w-5 h-5 shrink-0" />
  <div><p class="alert-title">Payment pending</p><p>Pay within 24 hours to keep this date.</p></div>
</div>

<div class="empty-state">
  <div class="empty-state-icon"><AppIcon icon="calendar-event" class="w-5 h-5" /></div>
  <p class="empty-state-title">No bookings yet</p>
  <p class="empty-state-desc">When you book a venue it will show up here.</p>
  <div class="empty-state-actions"><RouterLink to="/venues" class="btn-primary">Browse venues</RouterLink></div>
</div>

<div class="skeleton h-4 w-32"></div>
```
Every empty state has an action. Toasts: `toast.success()/error()` from `vue-sonner` (already themed).

### Other helpers
`heading-1/2/3`, `text-display` (hero), `eyebrow`, `text-meta`, `ref` (mono IDs),
`link`, `avatar`, `menu` + `menu-item` (dropdowns), `divider`, `kbd`.
Icons: `<AppIcon icon="…" />` (lucide). New names: `trending-up`, `trending-down`,
`minus`, `inbox`, `wallet`, `receipt`, `banknote`, `arrow-up-right`,
`arrow-down-right`, `calendar-clock`, `chart-bar`, `list-filter`, `shield-check`.

## Dark mode
- Portals toggle `dark` on `<html>` (theme store, `localStorage.themeMode`).
  Public pages are light-only today but use the same tokens, so they are dark-ready.
- With semantic tokens nothing extra is needed. With legacy classes, add the
  `dark:` pair (`bg-white dark:bg-warm-800`, `text-warm-900 dark:text-white`).
- Charts: use `--chart-1..5`, `--chart-grid`, `--chart-axis`; solid fills only.

## Photography
Real venue photos beat illustrations. Use the venue's own images (via
`getStorageUrl`) or `/images/venue-hall.jpg`. For text on a photo, use a flat
scrim (`bg-warm-900/55`) or a solid caption panel — never a gradient fade.
Always set `object-cover`, explicit aspect ratio (`aspect-[4/3]`), and `alt`.

## Accessibility checklist
- Text 4.5:1, UI/borders that identify controls 3:1 (tokens already pass).
- Visible focus: global `:focus-visible` ring — don't remove outlines.
- Icon-only buttons need `aria-label`. Status is never colour-only (badges carry text and a dot).
- One `h1` per page, headings in order.

## Smooth updates (no reloads, no flicker)

Every action must update the screen in place. Never reload a list with its loading
state after an action, and never block unrelated buttons.

- **Lists and pages:** `useSilentList(loader)` (or `useSilentResource` for one object).
  `loading` is true only for the first load — show skeletons only for that. After an
  action call `list.refresh()`: it swaps in fresh data quietly, merges overlapping
  refreshes and ignores stale responses. It also refreshes quietly when the tab is
  shown again or the device comes back online.
- **Row actions:** `useRowActions()`. `actions.run(id, { apply, request, rollback,
  success, error, after })` changes the row instantly, sends the request, shows a
  toast, and rolls back with an error toast if the server refuses. Use
  `actions.isPending(id[, kind])` to disable or spin only that row's buttons, so
  people can act on one row after another without waiting.
- **Dialogs** (reject reason, confirm delete): close the dialog as soon as the input
  is valid, then run the row action — the row shows the change straight away.
- **Data changed elsewhere:** `useLiveRefresh(['booking', 'payment'], () => list.refresh())`
  refreshes quietly when a realtime notification of that kind arrives.
- **Feedback:** use `toast` from `vue-sonner` for results (short, specific); keep
  inline errors for form fields.

Reference: `src/views/store/BookingsView.vue`.
