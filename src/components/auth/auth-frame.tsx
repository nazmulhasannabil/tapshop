"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Centers the auth card and keeps the form reachable when the mobile keyboard
 * covers the layout viewport.
 */
export function AuthFrame({ children }: { children: ReactNode }) {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function update() {
      if (!viewport) return;
      const overlap = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardInset(overlap > 80 ? overlap : 0);
    }

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-background">
      <div
        className="flex min-h-[100dvh] items-center justify-center px-5 py-8"
        style={{ paddingBottom: keyboardInset ? keyboardInset + 16 : undefined }}
      >
        <div className="my-auto w-full max-w-[22.5rem]">{children}</div>
      </div>
    </div>
  );
}
