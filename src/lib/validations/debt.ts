import { z } from "zod";
import { DEBT_DIRECTION, DEBT_STATUS } from "@/lib/social-constants";

export const createDebtSchema = z.object({
  direction: z.enum([DEBT_DIRECTION.THEY_OWE_ME, DEBT_DIRECTION.I_OWE_THEM]),
  /** Friend user id when selected from autocomplete; omit for free-text. */
  counterpartyUserId: z.string().min(1).optional().nullable(),
  /** Display name — required when no friend id, or used as override. */
  counterpartyName: z
    .string()
    .trim()
    .min(1, "Who is this with?")
    .max(100, "Keep the name under 100 characters."),
  amount: z
    .number()
    .positive("Amount must be greater than 0.")
    .max(10_000_000, "That amount looks off."),
  occurredOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date (YYYY-MM-DD)."),
  note: z.string().trim().max(500).optional().nullable(),
});
export type CreateDebtInput = z.infer<typeof createDebtSchema>;

export const updateDebtSchema = z.object({
  status: z.enum([DEBT_STATUS.OPEN, DEBT_STATUS.SETTLED, DEBT_STATUS.CANCELLED]).optional(),
  amount: z.number().positive().max(10_000_000).optional(),
  note: z.string().trim().max(500).optional().nullable(),
  occurredOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
