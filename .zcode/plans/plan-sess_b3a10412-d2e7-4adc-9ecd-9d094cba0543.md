# Quick Tap / Daily Spending — Home Interface Redesign

## Approach
Reuse the entire data/state/API layer untouched (types, Zustand store, `useBill()` hook, `/api/bill/*` routes, service layer, home page data fetch). This is a **presentation reshape** of the billing UI **plus a new bottom navigation**. No DB/schema/backend changes.

Confirmed decisions:
- **Sections**: keep all three — Recent Taps (chips) + Your Go-Tos (frequent, 2-col grid) + All Items (catalog grid + Add).
- **Activity/Stats nav tabs**: create minimal stub pages so all four tabs navigate.

Unanswered (using best judgment — easy to veto):
- **Progress bar** = daily spending target (default `৳500`, a tunable constant). No DB change; purely client-side.

---

## 1. Design tokens — `src/app/globals.css`
Shift the theme to match the reference (indigo primary, lavender background, deep emerald success). This also keeps auth/profile screens consistent.
- `--primary` (light): violet `oklch(0.54 0.232 293)` → **bright indigo** `oklch(0.50 0.22 264)`; `--ring` to match. Dark: `oklch(0.62 0.20 264)`.
- `--background` (light): near-white → **light lavender** `oklch(0.98 0.012 285)`.
- `--accent`: lavender tint `oklch(0.96 0.018 285)` / indigo foreground (used for chip backgrounds + progress track).
- `--success`: medium green → **deep emerald** `oklch(0.55 0.14 162)`; dark `oklch(0.70 0.16 162)`.
- Sync `--chart-1`/`--chart-2` and `--sidebar-primary` to the new primary/success so nothing references the old violet.

## 2. Font — `src/app/layout.tsx`
Swap body font **Geist → Inter** via `next/font/google` (keep `--font-sans` variable; leave Geist_Mono for mono). The spec explicitly requests Inter.

## 3. Daily target — `src/lib/constants.ts`
Add `DEFAULT_DAILY_TARGET = 500` (exported constant). Used only for the progress bar fraction.

## 4. Product card selected state — `src/components/billing/bill-item-card.tsx`
Adjust the existing card (used by both grids) to match the reference's selected state:
- Selected (`qty > 0`): **indigo border** (`border-2 border-primary`) + soft shadow; unselected stays `ring-1 ring-foreground/10`.
- **Minus button** moves from bottom-right → **top-left** (circular, `bg-background/90`).
- **Quantity badge** top-right changes from `×{qty}` → **`{qty}`** (plain number), indigo circle.

## 5. Recent Taps chips — `src/components/billing/recent-taps.tsx` (NEW)
Horizontal scrollable pill chips replacing compact cards:
- Lavender bg (`bg-accent`), thin border, `rounded-full`/`rounded-2xl`, emoji + name + price inline, indigo **`×{qty}`** indicator (reads `useBillEntry` for live qty, hidden when 0).
- Tapping a chip calls `addItem` + `onItemTap` (bump to front), reusing `useBill()`.
- Uses existing `no-scrollbar` utility.

## 6. Today's Bill card + layout — `src/components/billing/billing-screen.tsx`
Reshape the header into the reference's bill card and rewire sections:
- Slim greeting line ("Hey {name} 👋") — **drop the profile avatar circle** (Profile now lives in the bottom nav).
- **Bill card** (white, `rounded-3xl`, shadow): `TODAY'S BILL` label, large `<AnimatedTotal>` (৳240), right-side rounded **"12 items" badge**, and the **progress bar** (lavender track `bg-accent`, indigo fill `bg-primary`, `rounded-full`, width = `min(100%, total/target)`).
- **Recent Taps** section → `<RecentTaps>` chips (only when `recentItems.length > 0`).
- **Your Go-Tos** section → `<ItemGrid>` with `frequent` items (2-col).
- **All Items** section → `<ItemGrid>` with full `catalog` + the existing **Add** button (opens `AddItemSheet`).
- Add bottom padding to `<main>` so content clears the floating bar + nav; keep `<BillSheet>` + `<AddItemSheet>` wiring as-is.

## 7. Floating green bill bar — `src/components/billing/bill-summary.tsx`
Redesign the persistent summary into the reference's floating action bar:
- **Emerald green** (`bg-success text-success-foreground`), `rounded-3xl`, shadow, `fixed` and centered (`mx-auto max-w-md`), floating **above** the bottom nav (`bottom-[nav height + gap]`).
- Left: light badge **"8 items"** (live `count`). Center: large bold **৳240** (`<AnimatedTotal>`). Right: **"VIEW BILL →"**.
- `onClick` opens the existing `<BillSheet>` (unchanged). Disabled when `count === 0`.

## 8. Bottom navigation — `src/components/nav/bottom-nav.tsx` (NEW)
Fixed white bar, subtle top border/shadow, 4 tabs via `next/link` + `usePathname`:
- 🏠 Home (`/home`, active=indigo), 🧾 Activity (`/activity`), 📊 Stats (`/stats`), 👤 Profile (`/profile`).
- Active tab: indigo icon + label; inactive: muted gray. Safe-area bottom padding. Uses `lucide-react` icons (`Home`, `ReceiptText`, `BarChart3`, `User`).

## 9. Route group layout — `src/app/(user)/layout.tsx` (NEW)
Wraps `home`, `profile`, `activity`, `stats`: renders `{children}` then the fixed `<BottomNav>`. (Auth pages in `(auth)` remain untouched.)

## 10. Stub pages — `src/app/(user)/activity/page.tsx` + `src/app/(user)/stats/page.tsx` (NEW)
Minimal centered "Coming soon" placeholders (title + icon) behind `requireUser()`, styled to match — so the nav is fully clickable with no dead links.

## 11. Cleanup
Delete the now-unused `src/components/billing/item-row.tsx` (only referenced by `billing-screen.tsx`, which no longer uses it after Recent Taps → chips and Go-Tos → grid).

---

## Not changing
`bill-store.ts`, `use-bill.ts`, `types/bill.ts`, `bill-sheet.tsx`, `add-item-sheet.tsx`, `animated-total.tsx`, `empty-state.tsx`, all `/api/*` routes, services, DB schema, and the proxy. Existing tests (store/constants) assert pure functions, not markup — safe.

## Out of scope (per "do not add")
No charts, illustrations, gradients, sidebars, or extra sections. Activity/Stats are intentionally bare placeholders.

## Verify
Run `pnpm dev` to visually check `/home`, then `pnpm lint` + `pnpm exec tsc --noEmit` for type/lint cleanliness. Tap products to confirm qty badges, minus (top-left), live total, chips, and "VIEW BILL" sheet all update.