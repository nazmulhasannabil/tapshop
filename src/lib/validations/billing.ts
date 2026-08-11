import { z } from "zod";

/** Body shape for /api/bill/{add,decrease,remove}. */
export const billItemSchema = z.object({
  itemId: z.uuid({ message: "A valid item id is required." }),
});
export type BillItemInput = z.infer<typeof billItemSchema>;
