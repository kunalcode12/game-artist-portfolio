"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAchievements } from "./AchievementsProvider";
import { useSfx } from "./SfxProvider";

export type DisplayMode = "shaded" | "wire";

type State = { mode: DisplayMode; setMode: (m: DisplayMode) => void };
const DisplayModeContext = createContext<State>({ mode: "shaded", setMode: () => {} });

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

/**
 * Maya muscle memory: [4] wireframe, [5] smooth shade. On the home page this flips every
 * project card and the hero viewport between their beauty and wireframe passes.
 */
export function DisplayModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DisplayMode>("shaded");
  const [hud, setHud] = useState<{ key: number; mode: DisplayMode } | null>(null);
  const pathname = usePathname();
  const { unlock } = useAchievements();
  const { play } = useSfx();
  const hudTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setMode = useCallback(
    (m: DisplayMode) => {
      setModeState(m);
      setHud({ key: performance.now(), mode: m });
      play("switch");
      if (m === "wire") unlock("wireframe");
      clearTimeout(hudTimer.current);
      hudTimer.current = setTimeout(() => setHud(null), 1500);
    },
    [play, unlock]
  );

  useEffect(() => {
    document.documentElement.classList.toggle("mode-wire", mode === "wire");
  }, [mode]);

  useEffect(() => {
    if (pathname !== "/") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "4") setMode("wire");
      else if (e.key === "5" || e.key === "6") setMode("shaded");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, setMode]);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <DisplayModeContext value={value}>
      {children}
      <AnimatePresence>
        {hud && (
          <motion.div
            key={hud.key}
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed bottom-8 left-1/2 z-[80] -translate-x-1/2"
          >
            <div className="chamfer-sm flex items-center gap-3 border border-line-2 bg-black/80 px-4 py-2.5 backdrop-blur-md">
              <span className="kbd !text-accent">{hud.mode === "wire" ? "4" : "5"}</span>
              <span className="label text-ink">
                Viewport shading <span className="text-accent">·</span> {hud.mode === "wire" ? "Wireframe" : "Smooth shade"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DisplayModeContext>
  );
}

export const useDisplayMode = () => use(DisplayModeContext);
