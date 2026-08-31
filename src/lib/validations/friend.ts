import { z } from "zod";

export const inviteFriendSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .max(255)
    .transform((v) => v.toLowerCase()),
});
export type InviteFriendInput = z.infer<typeof inviteFriendSchema>;

export const friendshipIdSchema = z.object({
  friendshipId: z.string().min(1, "Missing friendship id."),
});
export type FriendshipIdInput = z.infer<typeof friendshipIdSchema>;

export const claimInviteSchema = z.object({
  token: z.string().min(1, "Missing invite token."),
});
export type ClaimInviteInput = z.infer<typeof claimInviteSchema>;
