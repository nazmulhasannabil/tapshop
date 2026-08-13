## Plan: Make Stats Page Dynamic with Live Updates

### Problem
The `/stats` page fetches data from the database once via a server component. When users tap items on the billing screen (which uses an optimistic Zustand store), the stats page doesn't reflect those changes until the user navigates away and back.

### Approach
Create a **stats Zustand store** that subscribes to the existing bill store, deriving real-time stats from the optimistic bill entries. This gives instant live updates without any new API calls for today's data.

---

### Step 1: Create `src/stores/stats-store.ts`

A new Zustand store that:

1. **Holds `StatsData`** — the same type from `stats.ts`
2. **`hydrate(serverStats)`** — initializes the store with server-fetched data (keeps `yesterdaySpend` and `mostUsed` as-is since they can't change from tapping)
3. **Subscribes to the bill store** via `useBillStore.subscribe()`:
   - Computes today's live spend from `computeTotals(entries).total`
   - Derives `todayDelta = liveTodaySpend - serverTodaySpend`
   - Updates:
     - `todaySpend` = liveTodaySpend (from bill store totals)
     - `weekSpend` = serverWeekSpend + todayDelta
     - `monthSpend` = serverMonthSpend + todayDelta
     - `itemsTapped` = serverItemsTapped + tapCountDelta
     - `weekly[todayIndex].value` = liveTodaySpend
   - `yesterdaySpend` and `mostUsed` remain unchanged (not affected by today's taps)
4. **Exposes selectors**: `useStatsData()` returning the full reactive `StatsData`
5. **`refreshFromServer(stats)`** — replaces server baseline (used when navigating back to stats page)

Key insight: The bill store already has `computeTotals()` which sums `qty * unitPrice` for all entries — this is exactly `todaySpend`. We just need to bridge it.

---

### Step 2: Create `src/app/api/stats/route.ts`

A lightweight GET API endpoint:
- Calls `requireUser()` for auth
- Calls `getStats(userId)` 
- Returns `Response.json({ ok: true, data: stats })`

This is used for periodic background refreshes to keep non-today data (like `mostUsed` and `itemsTapped` 30-day window) accurate.

---

### Step 3: Modify `src/app/(user)/stats/page.tsx`

Keep as a server component for fast SSR, but wrap `StatsScreen` in a client `<StatsProvider>`:

```tsx
export default async function StatsPage() {
  const session = await requireUser();
  const stats = await getStats(session.user.id);
  return (
    <StatsProvider initialStats={stats} userId={session.user.id} />
  );
}
```

---

### Step 4: Create `src/components/stats/stats-provider.tsx` (new client component)

A thin `"use client"` wrapper that:
1. Calls `statsStore.getState().hydrate(initialStats)` on mount (if not already hydrated)
2. Calls `statsStore.getState().refreshFromServer(initialStats)` when the page remounts (user navigates back)
3. Sets up a periodic refetch every 60 seconds via the `/api/stats` endpoint to keep `mostUsed` and `itemsTapped` accurate
4. Renders `<StatsScreen />` (no props needed — it reads from the store)

---

### Step 5: Modify `src/components/stats/stats-screen.tsx`

- Add `"use client"` directive (or have `StatsProvider` pass data as props while the component itself stays non-client — either works, but since it needs to react to store changes, making it a client component reading from the store is cleanest)
- Replace `stats` prop with `useStatsData()` selector from the stats store
- The component template stays **exactly the same** — only the data source changes

---

### Files Changed Summary

| File | Action | Lines Changed |
|------|--------|----------------|
| `src/stores/stats-store.ts` | **Create** | ~80 lines — store + selectors + bill store subscription |
| `src/app/api/stats/route.ts` | **Create** | ~15 lines — simple GET endpoint |
| `src/components/stats/stats-provider.tsx` | **Create** | ~40 lines — client wrapper with hydration + periodic refresh |
| `src/app/(user)/stats/page.tsx` | **Modify** | ~5 lines changed — wrap in StatsProvider |
| `src/components/stats/stats-screen.tsx` | **Modify** | ~10 lines changed — read from store instead of props |

### What Updates Live

| Metric | Source | Updates Live? |
|--------|--------|--------------|
| Today's Spend | Bill store `computeTotals().total` | ✅ Instant |
| Yesterday comparison | Server baseline (static) | ❌ (correct — yesterday doesn't change) |
| This Week | Server baseline + today delta | ✅ Instant |
| This Month | Server baseline + today delta | ✅ Instant |
| Items Tapped | Server baseline + today tap delta | ✅ Instant |
| Most Used | Server baseline | ⚡ Every 60s refresh |
| Weekly chart | Bill store today total | ✅ Instant |

### Why Not Simpler Alternatives

- **SWR polling only**: Would add latency (API round-trip on every tap) vs instant Zustand derivation
- **Server-Sent Events / WebSocket**: Overkill for a single-user stats page — the bill store already has the data
- **URL-based revalidation**: Only works on navigation, not live updates