# Prompt: finish the Admin panel upgrade (what is left after the first pass)

Paste this whole file into your AI IDE. Scope: the Admin panel (`/admin/*`) and the shared pieces it relies on. Do not touch the Owner, Conciergerie or Tenant panels, the landing page or auth, except where a task below says a shared file needs an admin-only branch.

## What is already done (do not redo)
- `src/lib/billingMetrics.ts` is the single source of money figures (MRR, billed, collected, outstanding, overdue, collection rate). Overview, Revenue, Invoices and Client detail use it.
- Invoice status `free` (0 MAD, "Free · launch offer"): never payable, never outstanding, never reminded. Filter chip "Free" exists on `/admin/invoices`.
- Casablanca time: the launch deadline reads "31 Jan 2027, 23:59 (Casablanca, GMT+1)" and is stored with its offset. Countdown shows "117 days left".
- Custom date picker + new `src/components/ui/custom-time-picker.tsx` replace every native date/time input in `src/components/admin`.
- Invoice timeline: pending steps are hollow and muted, "Scheduled · date" / "Not paid yet".
- Shared `src/components/admin/data-table.tsx` (sticky header, row click + chevron, ⋯ menu, sort, chips with counts, search, density toggle, column menu, CSV export, pagination, skeleton/empty/error), `AdminPage` with breadcrumb + gold hairline, `ClientAvatar`.
- `/admin/properties/:id` exists and rows open it. Overview command center, Revenue, Clients list + detail (tabs, notes, activity), Invoices (summary strip, bulk, ⋯ menu), Pricing (impact preview, gauge, countdown), Settings (validation + unsaved bar).
- Per-feature translations live in `src/locales/{en,fr,ar}/admin-{overview,clients,properties,invoices,pricing}.json`.

## Not done (your tasks)

### 1. Shared top bar and shell (admin-only branches)
- Language switcher in the Admin top bar should be a compact "EN ▾" pill (`src/components/language-switcher.tsx`, `src/components/app-shell.tsx`). Keep the other panels unchanged.
- Two monospace leftovers in the admin shell: the `⌘K` `<kbd>` in the top bar and the dev "Demo simulator" role badge (`font-mono` in `app-shell.tsx`). Render them in Inter with `tabular-nums` when `profile.role === "admin"`.
- The sidebar search is already hidden for admin; confirm the top-bar ⌘K command palette is the only search and works from every admin page.

### 2. Typography
- KPI figures on the Overview and Revenue pages should use Cormorant with lining numerals (`font-variant-numeric: lining-nums`) only for the big figures; everything else Inter + `tabular-nums`.
- Audit with `grep -rn "font-mono\|monospace" src/components/admin src/routes/admin` and in the browser (computed `font-family`). Zero monospace elements should remain on admin pages.

### 3. Gaps in the delivered pages
- **Properties list:** the old client and city dropdown filters were dropped; bring them back as DataTable toolbar filters. French labels use "CD/LD" for STR/LTR in the units column; use "STR/LTR" consistently.
- **Clients list:** the "offer" filter was removed when chips replaced the selects; add an offer filter back (toolbar select).
- **DataTable:** add an optional `footer` slot for a totals row (Revenue currently renders totals in a card under the table). Add a column-header tooltip for truncated headers.
- **Reminders:** "Send reminder" is a mock (toast + an in-memory activity entry on Overview, an `adminNotes` entry on client detail). Persist reminders in one place (`db`) with a proper `AdminActionKind` ("reminder") so Overview, Client Activity and Invoice detail all show the same history, and bump `SNAPSHOT_VERSION` in `src/services/store.ts` if the shape changes.
- **Settings:** IF, RC and Patente are digits-only in the form, but the shared `checkCompanyLegal` in `src/lib/admin.ts` still accepts letters. Make the rule match (numeric) in one place.
- **Breadcrumbs:** `Crumb.to` only allows a few routes, so Pricing and Settings link "Admin" to `/admin`. Widen the type to every admin route.
- **Overview funnel vs KPI:** the funnel counts invoices issued in the latest cycle, so its Overdue number can differ from the Outstanding KPI's all-time overdue count. Label both clearly or make them consistent, then re-verify that MRR, billed, collected, outstanding match on Overview, Revenue, Invoices and Client detail for the same period.
- **Sticky "Unsaved changes" bar** (Settings) is `fixed bottom-4`; make sure it clears the mobile bottom nav.
- Remove unused code left behind: old `overview.*` / `revenue.*` keys in `src/locales/*/admin.json` and `useAdminOverview` in `src/hooks/use-admin-data.ts` if nothing imports them.

### 4. Visual and behaviour QA (nobody has looked at these pages visually yet)
Open every page at 1440 and 1024 widths, on a phone width, in EN, FR and AR (RTL), and fix what breaks:
`/admin`, `/admin/clients`, `/admin/clients/:id` (all tabs), `/admin/properties`, `/admin/properties/:id`, `/admin/invoices` (bulk bar, filters, `?period=`), `/admin/invoices/:id` (paid, sent, overdue, free), `/admin/revenue` (all ranges), `/admin/pricing`, `/admin/settings`.
Checklist: no horizontal page scroll, numbers right-aligned (mirrored in RTL), mixed Latin/digit strings wrapped in `dir="ltr"`, tables switch to cards on phones, charts readable in AR, delist/ban/mark-paid flows work end to end and the money figures update everywhere afterwards, no console errors.

### 5. Tests and housekeeping
- Add unit tests for `billingMetrics.ts`, `invoiceSteps` (free, sent, overdue, paid), `casablancaDateTime` / `casablancaParts` (including a Ramadan date when Morocco is on GMT+0) and the RIB/ICE formatters.
- Run `npx vite build`, `npx tsc --noEmit -p .` (7 known pre-existing errors in brand-mark, language-switcher, scroll-reveal, tilt-card, custom-date-range-picker) and eslint. `src/routes/admin/properties.tsx` was deleted with `git rm` (staged, not committed).

## Images and media (cannot be done from code alone)
- **Property images:** `AdminPropertyRow.image` and the property detail hero use the same property photos as the rest of the app. Many are bright daylight interiors (see `docs/imagery-media-prompt.md` for the measured audit). Regrade or replace them so the Admin hero and 40px thumbnails look consistent: dark, chiaroscuro, warm gold highlights, near-black shadows. Export a 1600x700 hero crop and a 160x160 square thumbnail per property, AVIF/WebP + JPG, each under 150 KB.
- **Empty-state illustrations:** the Admin empty states (no clients matching, no properties, no invoices, no activity) reuse the architectural line illustrations. Produce 4 small matching gold line-art SVGs (doorway, ledger, key, document) at 240x160 for the Admin panel.
- **Client avatars:** the avatar is initials in a gold-outline circle; no photography needed. If you want logos for the demo clients, create 10 simple monochrome gold wordmark SVGs (no real brands).
- **Favicon / app icons:** replace `logo.jpg` as the favicon (non-square JPEG) with square PNG/SVG icons of the key monogram; PWA icons in `public/icons/` already exist.

## Definition of done
- Properties open to a detail page; 0 MAD invoices show "Free" with no Mark paid; the deadline reads 23:59 Casablanca; MRR, billed and collected match across Overview, Revenue, Invoices and Client detail; no monospace fonts and no native date/time inputs remain; no repeated red action buttons in tables; the Overview has charts and trends; all admin pages pass the QA checklist above in EN, FR and AR.
