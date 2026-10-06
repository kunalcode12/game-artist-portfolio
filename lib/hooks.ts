"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/** True once the browser has an idle moment after load — for decorative, deferrable work. */
export function useIdle(timeout = 2000) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setIdle(true), { timeout });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setIdle(true), 600);
    return () => clearTimeout(t);
  }, [timeout]);
  return idle;
}

/** SSR-safe media query (false on the server and during hydration). */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");
export const useIsMobile = () => useMediaQuery("(max-width: 767px)");

/** Deterministic PRNG so "random" layouts are pure and identical on every render. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
