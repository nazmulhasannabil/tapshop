# Plan: TapShop Profile screen + light background

Two changes: (A) lock the app to the light theme, (B) rebuild the Profile screen to match the reference design using the existing TapShop design system + real user data.

---

## A. Background: dark → light (entire app)

**Root cause:** `src/app/layout.tsx:51-56` sets `defaultTheme="system"` + `enableSystem`, so the app renders the `.dark` theme whenever your OS is dark. The light palette already exists in CSS (`globals.css:70`). We just stop following the OS.

**Edit `src/app/layout.tsx`** — the `ThemeProvider` becomes:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="light"
  disableTransitionOnChange
>
```
(drop `enableSystem`, set `defaultTheme="light"`). Every screen now always renders on the light lavender background. The `.dark` CSS block stays in `globals.css` (harmless; available if dark mode is re-enabled later).

---

## B. Data layer (real user data)

**New file `src/lib/services/profile.ts`** — exports `getProfileData(userId)`:
```ts
getProfileData(userId): Promise<{
  totalConsumption: number;                          // sum of all billEntries.subtotal
  favoriteItem: { name: string; icon: string | null } | null;
  memberSinceLabel: string;                          // e.g. "June 2023"
}>
```
- `totalConsumption`: `coalesce(sum(billEntries.subtotal), 0)` for the user, coerced via the existing `num()` pattern (mirror imports/queries from `src/lib/services/stats.ts`). Uses `billEntries` from `src/db/schema/bill-entries.ts`.
- `favoriteItem`: reuse the existing `getMostUsed(userId)` from `src/lib/services/stats.ts` (returns `{ name, icon } | null`).
- `memberSinceLabel`: select `users.createdAt` (`src/db/schema/auth.ts`), format with `Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" })`.
- Run the three queries with `Promise.all`.

**Edit `src/app/(user)/profile/page.tsx`** — fetch session + `getProfileData`, pass display-ready props:
```tsx
const session = await requireUser();
const { totalConsumption, favoriteItem, memberSinceLabel } = await getProfileData(session.user.id);
<ProfileView
  name={session.user.name}
  email={session.user.email}
  image={session.user.image}
  totalConsumptionLabel={formatCurrency(totalConsumption)}  // from constants.ts
  favoriteItem={favoriteItem}
  memberSinceLabel={memberSinceLabel}
/>
```

---

## C. Rewrite `src/components/user/profile-view.tsx`

Replace the current minimal shadcn-`<Card>` version with the reference layout, using the app's standard card pattern (`rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5`; `rounded-2xl` for the 2-col tiles — matches Stats tiles).

**New props:** `{ name, email, image, totalConsumptionLabel, favoriteItem, memberSinceLabel }`.

**Structure (top → bottom):**
1. **Top header** — reuse the existing `<AppHeader />` (`src/components/nav/app-header.tsx`), mounted sticky at top (`sticky top-0 z-30`) so it stays visible while scrolling. Gives brand center + bell right, consistent with Activity. (Drops the old "Back to home" link — the Home nav tab covers it, matching Home/Stats.)
2. **Profile section** — centered avatar on a soft lavender circle (`bg-accent`), with a floating edit pencil button bottom-right (`size-8 rounded-full bg-card shadow ring` with `Pencil` icon). Avatar shows `session.image` if present, else the first-initial fallback. Name bold; email muted.
3. **Total Consumption card** — white rounded card: uppercase label "TOTAL CONSUMPTION" (`text-xs tracking-wide text-muted-foreground`) + large indigo amount `totalConsumptionLabel` (`text-3xl font-bold text-primary tnum`).
4. **Summary 2-col grid** (`grid grid-cols-2 gap-3`), equal height:
   - **Favorite Item** — label "FAVORITE ITEM", icon (favoriteItem.icon or a fallback like `☕`), name (`favoriteItem?.name ?? "—"`).
   - **Member Since** — label "MEMBER SINCE", value `memberSinceLabel`.
5. **ACCOUNT SETTINGS** — small uppercase section heading, then one white card with 3 rows (Payment Methods / Personal Information / Notification Settings). Each row: lucide icon (`CreditCard` / `User` / `Bell`) + label + right `ChevronRight`. Rows separated by `divide-y divide-border`, each a tappable button with pressed feedback → shows a Sonner `toast("… — coming soon")`.
6. **APP SETTINGS** — heading + one white card with 3 rows:
   - Appearance — `Palette` icon, value "Light" (reflects locked theme), chevron.
   - Language — `Globe` icon, value "English", chevron.
   - Help & Support — `HelpCircle` icon, chevron.
   All tappable → "coming soon" toast.
7. **Logout button** — full-width rounded button using the existing soft-red look (`bg-destructive/10 text-destructive` — same as `Button variant="destructive"`), `LogOut` icon + "Logout" text, large touch target. **On tap → opens a confirmation dialog; only on confirm does it run the existing `handleLogout` (`authClient.signOut()` → `router.push("/login")`)**, keeping the current pending/spinner state.

**Logout confirmation dialog:** check `src/components/ui/` for an existing `alert-dialog`/`dialog` primitive and reuse it. If none exists, add a minimal inline confirm modal (fixed overlay + centered card, using `motion` + the design tokens already in the project) — no new dependency.

**Toasts:** `import { toast } from "sonner"` (Toaster already mounted in root layout). No new dependency.

**Icons:** all from `lucide-react` (`CreditCard, User, Bell, Palette, Globe, HelpCircle, ChevronRight, Pencil, LogOut, Loader2`).

---

## Out of scope (deliberately)
- **Bottom-nav active style** stays as-is (current `bg-primary/10` chip + `text-primary`). The reference shows a filled indigo pill, but changing the shared nav would alter Home/Activity/Stats active states too — keeping it preserves cross-screen consistency. Easy to revisit if you want the pill.
- The 6 settings rows are visual + "coming soon" only (per your choice) — no destination pages built.
- No new profile/user DB columns or auth-config changes (member-since is read directly from the existing `users.createdAt`).

---

## Files touched
| File | Change |
|---|---|
| `src/app/layout.tsx` | `defaultTheme="light"`, remove `enableSystem` |
| `src/lib/services/profile.ts` | **New** — `getProfileData(userId)` |
| `src/app/(user)/profile/page.tsx` | Fetch + pass real data props |
| `src/components/user/profile-view.tsx` | Full rewrite to match reference |

## Verification
- Run `pnpm dev`, open `/profile` (and toggle OS dark mode) — confirm the page and all tabs stay on the light lavender background.
- Confirm cards show real data: total consumption reflects billed items, favorite item matches Stats "most used", member-since matches the account's `createdAt`.
- Tap each settings row → "coming soon" toast; tap Logout → confirm dialog → sign out → `/login`.
- Check nothing is hidden behind the fixed bottom nav (bottom padding uses `--bottom-nav-h` + safe-area).