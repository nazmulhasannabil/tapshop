import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

/**
 * Client notification store — UI state only, NOT persisted.
 *
 * Holds the list shown in the bell dropdown (seeded with a few static/mock
 * entries) plus the set of ids marked read this session. Real events push into
 * this store (e.g. `useSpendMilestone` adds an entry each time the bill crosses
 * a ৳100 milestone), so they count toward the unread badge and appear in the
 * list alongside the seed items. Nothing survives a reload.
 */
export type Notification = {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
};

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    icon: "🎉",
    title: "Welcome to TapShop!",
    body: "Tap a drink to start tracking today's bill.",
    time: "just now",
  },
  {
    id: "2",
    icon: "🎯",
    title: "Daily target: ৳500",
    body: "Watch the progress bar as today's bill adds up.",
    time: "2h ago",
  },
  {
    id: "3",
    icon: "☕",
    title: "Tip: your go-tos stay on top",
    body: "Most-tapped drinks float up for faster re-taps.",
    time: "1d ago",
  },
];

type NotificationStoreState = {
  notifications: Notification[];
  readIds: Set<string>;
  /** Prepend a notification (newest first); no-op if `id` already exists. */
  push: (notification: Notification) => void;
  /** Mark every notification as read, clearing the badge. */
  markAllRead: () => void;
};

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  notifications: SEED_NOTIFICATIONS,
  readIds: new Set(),

  push: (notification) =>
    set((state) => {
      if (state.notifications.some((n) => n.id === notification.id)) return state;
      return { notifications: [notification, ...state.notifications] };
    }),

  markAllRead: () =>
    set((state) => ({
      readIds: new Set(state.notifications.map((n) => n.id)),
    })),
}));

/* ------------------------------- Selectors -------------------------------- */

export const useNotificationState = (): {
  notifications: Notification[];
  readIds: Set<string>;
} =>
  useNotificationStore(
    useShallow((s) => ({ notifications: s.notifications, readIds: s.readIds })),
  );

export const useUnreadCount = (): number =>
  useNotificationStore(
    (s) => s.notifications.filter((n) => !s.readIds.has(n.id)).length,
  );
