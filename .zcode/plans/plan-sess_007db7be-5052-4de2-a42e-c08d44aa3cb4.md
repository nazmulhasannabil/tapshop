Wire the spend-milestone toast into the bell dropdown so real notifications count toward the badge and appear in the list. Follow the existing `bill-store.ts` zustand pattern (no new deps, no DB — stays session-only like today).

### 1. New file: `src/stores/notification-store.ts`
Mirror `bill-store.ts` conventions (`create`, `useShallow`, selector hooks, header comment noting "session-only, not persisted").
- `Notification` type: `{ id, icon, title, body, time }` (same shape as the current `StaticNotification`).
- Seed `notifications` with the 3 existing mock entries (moved out of app-header verbatim) and `readIds: Set<string>` empty.
- Actions:
  - `push(n)` — `unshift` to top (newest first), **de-dupe by `id`** (ignore if already present, so re-crossing a milestone never duplicates).
  - `markAllRead()` — add every notification id to `readIds`.
- Selectors:
  - `useNotificationState()` → `{ notifications, readIds }` via `useShallow` (keeps app-header's existing `!readIds.has(id)` unread logic unchanged).
  - `useUnreadCount()` → number.
- Also export `markAllRead` via the store for imperative use if needed.

### 2. Update `src/hooks/use-spend-milestone.ts`
In the milestone-crossing loop, alongside each existing `toast(...)` call, also push into the store imperatively:
```ts
useNotificationStore.getState().push({
  id: `spend-milestone-${m}`,
  icon: "🎉",
  title: `You've spent over ${formatCurrency(m * STEP)}!`,
  body: "Your today's bill is adding up.",
  time: "just now",
});
```
Stable id = `spend-milestone-${m}` guarantees idempotency. The toast stays (user wants toast + list entry).

### 3. Update `src/components/nav/app-header.tsx`
Minimal diff — swap the data source, keep all markup/behavior:
- Remove the local `NOTIFICATIONS` const and the `const [readIds, setReadIds] = useState(...)` (move mock data into the store seed).
- Add `const { notifications, readIds } = useNotificationState();` and `const markAllRead = useNotificationStore((s) => s.markAllRead);`.
- "Mark all read" `onClick` → `markAllRead()` instead of `setReadIds(...)`.
- Everything else unchanged: the `unread`/`unreadCount` derivation, badge, list rendering, Escape handler, and the close-on-route-change effect added previously.

### Result
Tapping a drink past a ৳100 milestone fires the toast AND prepends a notification to the bell (badge increments). "Mark all read" still clears the badge. Seed mock notifications remain as today. No DB/API/persistence changes — consistent with the current session-only design.