# Form components

Every form in EventGenius is built from these components. They share one
size scale, one look and the same accessibility wiring. See them all, in every
state, at **/dev/forms** (dev server) or **/support/dev/forms** (admin only on a
deployed build).

```ts
import { FormField, TextInput, DatePicker, rules, useValidation } from '@/components/forms'
```

## Size scale

| size | height | use |
|---|---|---|
| `sm` | 32px (`--control-h-sm`) | dense toolbars, table pagers, top bar |
| `md` | 40px (`--control-h-md`, 44px on touch) | **default** for every form |
| `lg` | 48px (`--control-h-lg`) | hero search, auth submit, OTP |

Controls in the same row use the same size. Buttons inset inside a field
(clear, show password, steppers, search submit) are 8px shorter than the field
with an even 4px gap. Every component takes `size="sm|md|lg"`; inside a
`FormField` it inherits the field's `size`.

## Shared props (all input components)

`id`, `size`, `invalid`, `disabled`, `readonly`, `required`, `describedby`.
Inside `FormField` you normally don't set `id`, `invalid`, `required` or
`describedby` — they come from the field. Other attributes (`autocomplete`,
`name`, `aria-label`, `@blur`, `@keydown.enter`, …) go to the inner native
element; `class`/`style` go to the outer box.

## FormField

Label + control + hint / error / character count.

| prop | type | notes |
|---|---|---|
| `label` | string | |
| `id` | string | id of the inner control (auto when omitted) |
| `hint` | string | hidden while an error shows |
| `error` | string \| string[] \| null | Laravel `errors.field` arrays show the first entry |
| `required` / `optional` | boolean | red `*` / "(optional)" after the label |
| `count`, `maxlength` | number | character counter, e.g. `:count="form.bio.length" :maxlength="500"` |
| `labelHidden` | boolean | sr-only label |
| `group` | boolean | for radio/checkbox/rating groups (label becomes `aria-labelledby`) |
| `size`, `disabled` | | passed down to the control |

Slots: default (`{ id, describedBy, invalid }`), `label`, `label-extra` (e.g. "Forgot password?"), `hint`, `after`.

```vue
<FormField label="Email" required :error="errors.email">
  <TextInput v-model="form.email" type="email" autocomplete="email" />
</FormField>
```

## Text

- **TextInput** — `v-model: string`. Props: `type` (text/email/url/search/tel), `placeholder`, `clearable`, `clearLabel`, `prefixIcon`, `suffixIcon`, `prefix`, `suffix` (short text such as `https://`, `sq ft`), `loading`, `maxlength`, `autocomplete`, `inputmode`. Emits `clear`. Slots `prefix`, `suffix`, `actions`. Exposes `focus()`.
- **PasswordInput** — `v-model: string`. Inset show/hide toggle (`aria-pressed`). Props: `autocomplete`, `minlength`, `strength` (4-bar meter), `toggleName`, `prefixIcon`.
- **TextareaInput** — `v-model: string`. Props: `rows` (4), `autoGrow`, `maxRows` (14), `counter` (own counter under the box; or use FormField `count`), `maxlength`, `placeholder`. Exposes `focus()`.

## Numbers and Pakistani formats

- **NumberInput** — `v-model: number | null` (null when empty). Props: `min`, `max`, `step` (1), `decimals` (from step), `stepper` (true: inset − / + buttons), `clamp` (clamp typed values on blur; off by default so form validation decides), `prefix`, `prefixIcon`, `suffix`, `placeholder`. Keyboard: ↑/↓ step, PageUp/PageDown ×10, Home/End min/max. `role="spinbutton"`.
- **CurrencyInput** — `v-model: number | null`. Shows `PKR 1,250,000` when idle, the plain number while editing. Props: `currency` ("PKR"), `decimals` (0), `suffix` (e.g. "/ head"), `placeholder`.
- **PhoneInput** — `v-model: string`. Pakistani mobile, formats to `03XX-XXXXXXX`, accepts +92 / 92 / 0. `modelFormat`: `formatted` (default `0300-1234567`), `digits` (`03001234567`), `intl` (`+92 300 1234567`), `raw` (exactly what was typed — used where the API already accepts any format). `showValid` tick. Validate with `rules.pkMobile()`.
- **CnicInput** — `v-model: string` masked as `35202-1234567-1`. Validate with `rules.cnic()`.

## Choices

- **SelectInput** — native select. `v-model: any`. `options: (string | number | { value, label, disabled?, group? })[]` — values keep their type. `placeholder`, `placeholderDisabled`, `emptyValue` (''). Without `options`, put `<option>`s in the slot. Native `@change`/`@blur` work.
- **Combobox** — searchable select (ARIA combobox + listbox). `v-model: any`. `options` (strings or `{ value, label, description?, disabled? }`) **or** `search(query) => Promise<options>` for async (`debounce` 250, `minChars`). `allowCustom` (typed text becomes the value), `clearable`, `prefixIcon`, `placeholder`, `emptyText`, `loading`. Emits `select(option | null)`. Keys: ↓/↑ open & move, Enter choose, Esc close, Tab leave.
- **MultiSelect** — chips. `v-model: any[]`. `options`, `creatable`, `max`, `normalize`, `placeholder`, `emptyText`. Backspace removes the last chip.
- **TagsInput** — free-text chips (`creatable` MultiSelect). `v-model: string[]`, `suggestions`, `max`.
- **CheckboxInput** — `v-model: boolean` (or an array with `value`). `label`, `description`, `indeterminate`, `name`. Default slot = label.
- **CheckboxGroup** — `v-model: any[]`. `options: (string | { value, label, description?, icon?, meta?, disabled? })[]`, `variant: 'list' | 'cards'`, `columns: 1–4`. `meta` is right-aligned text such as a price ("+ PKR 15,000", "Included").
- **RadioGroup** — `v-model: any`. `options`, `inline`, `name`.
- **RadioCards** — `v-model: any`. `options: { value, label, description?, icon?, meta?, disabled? }[]`, `columns: 1 | 2 | 3` (2), `name`.
- **SwitchInput** — `v-model: boolean`, `role="switch"`. `label`, `description`, `size: 'sm' | 'md'`, `labelPosition: 'end' | 'start'`.
- **SegmentedControl** — `v-model: any`. `options: (string | { value, label, icon?, iconOnly?, count?, disabled? })[]`, `size`, `block`, `ariaLabel`. Emits `change`. ←/→/Home/End.

## Dates and times

- **DatePicker** — `v-model: string` (`YYYY-MM-DD`, `''` when empty). Shows `28 Nov 2026`.
  Props: `min`, `max` (ISO), `disabledDates: string[] | (iso, date) => boolean`,
  `dayMeta: (iso, date) => { tone?: 'success'|'warning'|'danger'|'info'|'neutral', label?: string, disabled?: boolean } | null`
  (marks days — tone dot + colour, label read by screen readers/tooltip — e.g. availability),
  `inline` (just the calendar, no field/popover), `clearable`, `placeholder`, `name` (hidden input), `ariaLabel`.
  Emits `change(iso)` and `month-change('YYYY-MM')` whenever the shown month changes (load availability for that month).
  Keyboard: Enter/Space/↓ open; arrows day/week; PageUp/PageDown month (Shift = year); Home/End week; Enter pick; Esc close. Week starts Monday.
- **DateRangePicker** — `v-model:start`, `v-model:end` (ISO strings). `presets: ('today'|'last7'|'last30'|'thisMonth'|'next7'|'next30'|'nextMonth')[]`, `min`, `max`, `dayMeta`, `clearable` (true), `placeholder`. Emits `change({ start, end })`.
- **TimePicker** — `v-model: string` (`HH:mm`, 24-hour, what the API stores); shows 12-hour (`2:30 PM`). Props: `step` (15 min), `min`, `max`, `options` (explicit list, e.g. hourly + `23:59`), `clearable`, `placeholder`. Emits `change`. Keyboard: ↑/↓ on the closed field step the time; Alt+↓/Enter/Space open; in the list ↑/↓/Home/End/PageUp/PageDown, Enter pick, Esc close.

## Sliders, rating, OTP

- **SliderInput** — `v-model: number`. `min`, `max`, `step`, `showValue`, `showLimits`, `format(v)`, `color` (fill/handle colour). Native range input.
- **RangeSlider** — `v-model: [number, number]`. Same props plus `minGap`, `minLabel`, `maxLabel`.
- **RatingInput** — `v-model: number | null`. `max` (5), `size`, `showText` (Poor…Excellent), `labels`, `allowHalf` (slider, ←/→ ±0.5), `readonly` (one labelled image, no buttons; `showValue`), `name`, `labelledby`.
- **OtpInput** — `v-model: string`. `length` (6), `numeric`, `size` (lg). Paste fills all boxes, Backspace goes back. Emits `complete(code)`.

## Files and location

- **FileUpload** — drag & drop or click. `v-model: File[]`. `accept`, `multiple`, `maxSize` (MB per file), `maxFiles`, `instant` (don't keep files; just emit `select(files)` so the page uploads straight away), `grid`, `compact`, `title`, `hint`, `icon`, `progress: number[]` (0–100 per file). Emits `select`, `error(messages)`. Slot `progress` (`{ file, index }`). Exposes `open()`.
- **ImageUpload** — FileUpload preset for photos (JPEG/PNG/WebP, 5 MB, thumbnail grid).
- **LocationInput** — `v-model: { address, city?, latitude, longitude }`. `cities` (shows a city Combobox), `coordinates` (lat/lng fields + "Use my location"), `required`, `errors`. No map library.

## Form actions

- **FormActions** — Save / Cancel row; `sticky` turns it into a floating save bar with status text. Props: `saveLabel`, `savingLabel`, `saveIcon`, `cancelLabel`, `cancelTo` (route), `saving`, `disabled`, `dirty`, `error`, `success`, `idleText`, `formId` (submit a form elsewhere) or `submit` (inside the form), `size`, `align`. Emits `save`, `cancel`. Slots `status`, `secondary`.

## Validation helper

```ts
const v = useValidation(form, {
  email: [rules.required('Enter your email.'), rules.email()],
  phone: [rules.pkMobile()],
})
// <TextInput @blur="v.touch('email')" />  <FormField :error="v.error('email')">
if (!v.validateAll()) return
```
Rules: `required`, `email`, `url`, `minLength`, `maxLength`, `min`, `max`, `pkMobile`, `cnic`, `sameAs`. A rule returns `true` or a message.
Helpers in `utils.ts`: `toISODate`, `parseISODate`, `formatDisplayDate`, `to12h`, `normalizeTime`, `groupNumber`, `formatPkMobile`, `isPkMobile`, `formatCnic`, `formatBytes`.

## Rules

- Keep payloads unchanged: numbers stay numbers (`NumberInput`/`CurrencyInput` give `number | null`), dates `YYYY-MM-DD`, times `HH:mm`.
- Popovers are teleported to `<body>`, so they work inside cards/tables with `overflow: hidden` and in modals.
- No new dependencies; icons through `AppIcon`.
