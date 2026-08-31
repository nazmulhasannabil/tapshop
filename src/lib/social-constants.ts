/** Shared debt / friendship enums safe for client + server imports. */

export const FRIENDSHIP_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  CANCELLED: "cancelled",
} as const;
export type FriendshipStatus = (typeof FRIENDSHIP_STATUS)[keyof typeof FRIENDSHIP_STATUS];

export const FRIEND_INVITE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
} as const;
export type FriendInviteStatus = (typeof FRIEND_INVITE_STATUS)[keyof typeof FRIEND_INVITE_STATUS];

export const DEBT_STATUS = {
  OPEN: "open",
  SETTLED: "settled",
  CANCELLED: "cancelled",
} as const;
export type DebtStatus = (typeof DEBT_STATUS)[keyof typeof DEBT_STATUS];

export const DEBT_DIRECTION = {
  THEY_OWE_ME: "they_owe_me",
  I_OWE_THEM: "i_owe_them",
} as const;
export type DebtDirection = (typeof DEBT_DIRECTION)[keyof typeof DEBT_DIRECTION];
