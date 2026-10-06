"use client";

import { ReactLenis, useLenis } from "lenis/react";
import type { ReactNode } from "react";

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.4,
        stopInertiaOnNavigate: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}

const NAV_OFFSET = -72;

/** Scrolls to a section id (or the top) through Lenis so it stays buttery. */
export function useScrollTo() {
  const lenis = useLenis();
  return (target: string | number, opts?: { immediate?: boolean }) => {
    const el = typeof target === "string" ? document.querySelector(target.startsWith("#") ? target : `#${target}`) : null;
    if (typeof target === "string" && !el) return false;
    const dest = typeof target === "number" ? target : (el as HTMLElement);
    if (lenis) lenis.scrollTo(dest, { offset: typeof target === "number" ? 0 : NAV_OFFSET, immediate: opts?.immediate, duration: 1.6 });
    else if (typeof dest === "number") window.scrollTo({ top: dest });
    else dest.scrollIntoView();
    return true;
  };
}
