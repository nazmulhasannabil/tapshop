"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/constants";

const STEP = 100;

/**
 * Fires a toast each time `total` crosses a new 100৳ milestone (over 100,
 * over 200, over 300, …) on the way up.
 *
 * Purely a UI nicety — nothing is persisted. Milestones already reached when
 * the hook first mounts (e.g. today's bill hydrated at ৳250) are not
 * announced, and dropping below a milestone then re-crossing it does not
 * re-fire (we track the high-water mark).
 *
 * "Over N" semantics: a milestone fires as soon as `total` strictly exceeds
 * the threshold, matching "spent more than 100৳".
 */
export function useSpendMilestone(total: number) {
  // Highest milestone already announced this session.
  const lastMilestoneRef = useRef(0);
  // Whether the initial (hydration) value has been recorded without firing.
  const initializedRef = useRef(false);

  useEffect(() => {
    // Count of thresholds `m*STEP` that `total` strictly exceeds.
    const current = Math.max(0, Math.ceil(total / STEP) - 1);

    if (!initializedRef.current) {
      initializedRef.current = true;
      lastMilestoneRef.current = current;
      return;
    }

    if (current > lastMilestoneRef.current) {
      for (let m = lastMilestoneRef.current + 1; m <= current; m++) {
        toast(`🎉 You've spent over ${formatCurrency(m * STEP)}!`, {
          description: "Your today's bill is adding up.",
        });
      }
      lastMilestoneRef.current = current;
    }
  }, [total]);
}
