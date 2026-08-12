## Scope
All changes are in **one file**: `src/components/user/profile-view.tsx`. No new files, no new dependencies (`next-themes` is already installed & configured, lucide icons and `cn` already exist), no layout changes.

---

## Requirement 1 — "Coming soon" pill on placeholder rows (minimal, toast unchanged)

1. Add an optional `comingSoon?: boolean` to the `SettingsRow` type.
2. Mark all placeholder rows `comingSoon: true`:
   - **Account Settings:** Payment Methods, Personal Information, Notification Settings
   - **App Settings:** Language, Help & Support
3. Update `SettingsRowButton` so that when `comingSoon` is `true`, it renders a minimal muted pill **instead of** the value + chevron:
   ```tsx
   <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
     Coming soon
   </span>
   ```
   - Normal rows (Appearance) keep `value` + `ChevronRight` as today.
4. **Toast stays exactly as-is** — `onClick` still calls `notifyComingSoon(row.label)` → `toast(\`${label} — coming soon\`)`.
5. The **Edit profile** pencil (small circular icon button) keeps only its toast — a pill doesn't fit a 32px circle, so it's excluded for cleanliness.

---

## Requirement 2 — Appearance (Light/Dark) fully functional

The theme system is already wired in `layout.tsx` (`ThemeProvider attribute="class" defaultTheme="light"`, `suppressHydrationWarning` on `<html>`) and `globals.css` has full light + dark OKLCH palettes + the Tailwind v4 `@custom-variant dark`. So this is purely UI.

1. **Import:** `useTheme` from `next-themes`; `Sun`, `Moon`, `Check` from `lucide-react`; `cn` from `@/lib/utils`.
2. **De-couple Appearance from the static array.** Remove Appearance from `appRows`; render it as a dedicated functional row that stays first in the App Settings list (above Language / Help & Support).
3. **Theme state & hydration guard:**
   ```tsx
   const { resolvedTheme, setTheme } = useTheme();
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   const themeLabel = mounted ? (resolvedTheme ?? "Light") : "Light"; // "Light" matches SSR default
   const [appearanceOpen, setAppearanceOpen] = useState(false);
   ```
   The Appearance row shows `value={themeLabel}` + chevron; tapping opens the sheet.
4. **Appearance bottom sheet** — mirrors the existing Logout modal (same `AnimatePresence` + `motion`, same `fixed inset-0 z-50` overlay + `max-w-sm rounded-3xl bg-card` panel, spring transition, backdrop tap to close):
   - Title "Appearance" + subtitle.
   - Two full-width option buttons: **Light** (Sun icon) and **Dark** (Moon icon).
   - Active option (where `resolvedTheme === mode`) gets `bg-primary/10 text-primary ring-1 ring-primary/20` + a `Check` icon; inactive options get `hover:bg-muted`.
   - Selecting an option calls `setTheme(mode)` then closes the sheet.
   - Escape-to-close added for parity with the Logout modal.

---

## Result
- Placeholder settings rows show a small "Coming soon" pill and still fire the existing toast on tap.
- Appearance row reflects the live theme and opens a Light/Dark bottom sheet that switches the whole app instantly (`.dark` class toggle), persisted by `next-themes`.

### Verification after implementation
- `pnpm dev` → open `/profile`: confirm pills appear on the 5 placeholder rows, toast still fires on tap.
- Tap Appearance → sheet opens, current theme checked; switch to Dark → app goes dark globally (cards, background, text); reload → persists.
- Check no React hydration warnings in the console.