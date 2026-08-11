"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/react";
import { formatCurrency } from "@/lib/constants";

/**
 * Smoothly tweens between monetary values without triggering React re-renders
 * (the digit is written straight to the DOM via the imperative `animate`).
 */
export function AnimatedTotal({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const controls = animate(previous.current, value, {
      duration: 0.28,
      ease: "easeOut",
      onUpdate: (latest) => {
        el.textContent = formatCurrency(latest);
      },
    });
    previous.current = value;

    return () => controls.stop();
  }, [value]);

  return (
    <span ref={ref} className={`tnum ${className ?? ""}`}>
      {formatCurrency(value)}
    </span>
  );
}
